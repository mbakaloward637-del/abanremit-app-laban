<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Wallet;
use App\Models\Transaction;
use App\Models\Notification;
use App\Models\Profile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    /**
     * POST /api/v1/webhooks/paystack
     * Handles Paystack payment confirmation
     */
    public function paystack(Request $request)
    {
        // Verify Paystack signature
        $secret = config('services.paystack.secret_key');
        if ($secret) {
            $signature = $request->header('x-paystack-signature');
            $computed = hash_hmac('sha512', $request->getContent(), $secret);
            if ($signature !== $computed) {
                Log::warning('Paystack webhook: invalid signature');
                return response()->json(['error' => 'Invalid signature'], 403);
            }
        }

        $payload = $request->all();
        $event = $payload['event'] ?? '';

        if ($event === 'charge.success') {
            $data = $payload['data'] ?? [];
            $reference = $data['reference'] ?? '';
            $amount = ($data['amount'] ?? 0) / 100; // Paystack sends in kobo
            $currency = strtoupper($data['currency'] ?? 'KES');
            $metadata = $data['metadata'] ?? [];
            $userId = $metadata['user_id'] ?? null;

            if (!$userId || !$reference) {
                Log::warning('Paystack webhook: missing user_id or reference', $data);
                return response()->json(['error' => 'Missing data'], 400);
            }

            // Prevent duplicate processing
            $existing = Transaction::where('reference', $reference)->first();
            if ($existing && $existing->status === 'completed') {
                return response()->json(['success' => true, 'message' => 'Already processed']);
            }

            $wallet = Wallet::where('user_id', $userId)->first();
            if (!$wallet) {
                Log::error("Paystack webhook: wallet not found for user {$userId}");
                return response()->json(['error' => 'Wallet not found'], 404);
            }

            // Credit wallet
            $wallet->increment('balance', $amount);

            // Update or create transaction
            if ($existing) {
                $existing->update(['status' => 'completed']);
            } else {
                Transaction::create([
                    'reference' => $reference,
                    'type' => 'deposit',
                    'receiver_user_id' => $userId,
                    'receiver_wallet_id' => $wallet->id,
                    'amount' => $amount,
                    'currency' => $currency,
                    'description' => 'Paystack Card Deposit',
                    'status' => 'completed',
                    'method' => 'card',
                    'provider' => 'Paystack',
                    'metadata' => ['paystack_ref' => $reference, 'channel' => $data['channel'] ?? 'card'],
                ]);
            }

            // Notify user
            Notification::create([
                'user_id' => $userId,
                'title' => 'Deposit Successful',
                'message' => "Your deposit of {$currency} {$amount} via card has been confirmed.",
                'type' => 'transaction',
            ]);

            Log::info("Paystack deposit confirmed: {$reference}, {$currency} {$amount} for user {$userId}");
        }

        return response()->json(['success' => true]);
    }

    /**
     * POST /api/v1/webhooks/mpesa/c2b
     * Handles M-Pesa C2B STK Push callback
     */
    public function mpesaC2B(Request $request)
    {
        $payload = $request->all();
        Log::info('M-Pesa C2B callback', $payload);

        $body = $payload['Body']['stkCallback'] ?? [];
        $resultCode = $body['ResultCode'] ?? -1;
        $merchantRequestID = $body['MerchantRequestID'] ?? '';
        $checkoutRequestID = $body['CheckoutRequestID'] ?? '';

        if ($resultCode !== 0) {
            // Payment failed or cancelled
            Log::info("M-Pesa STK Push failed/cancelled: ResultCode={$resultCode}");
            Transaction::where('metadata->checkout_request_id', $checkoutRequestID)
                ->update(['status' => 'failed']);
            return response()->json(['success' => true]);
        }

        // Extract callback metadata
        $items = $body['CallbackMetadata']['Item'] ?? [];
        $callbackData = [];
        foreach ($items as $item) {
            $callbackData[$item['Name']] = $item['Value'] ?? null;
        }

        $amount = $callbackData['Amount'] ?? 0;
        $mpesaRef = $callbackData['MpesaReceiptNumber'] ?? '';
        $phone = $callbackData['PhoneNumber'] ?? '';

        // Find user by phone
        $profile = Profile::where('phone', 'LIKE', '%' . substr($phone, -9))->first();
        if (!$profile) {
            Log::error("M-Pesa C2B: no user found for phone {$phone}");
            return response()->json(['success' => true]);
        }

        $wallet = Wallet::where('user_id', $profile->user_id)->first();
        if (!$wallet) {
            Log::error("M-Pesa C2B: wallet not found for user {$profile->user_id}");
            return response()->json(['success' => true]);
        }

        // Credit wallet
        $wallet->increment('balance', $amount);

        $ref = 'MPD' . time() . str_pad(rand(0, 999), 3, '0', STR_PAD_LEFT);
        Transaction::create([
            'reference' => $ref,
            'type' => 'deposit',
            'receiver_user_id' => $profile->user_id,
            'receiver_wallet_id' => $wallet->id,
            'amount' => $amount,
            'currency' => 'KES',
            'description' => 'M-Pesa Deposit',
            'status' => 'completed',
            'method' => 'mpesa',
            'provider' => 'M-Pesa',
            'metadata' => [
                'mpesa_receipt' => $mpesaRef,
                'phone' => $phone,
                'checkout_request_id' => $checkoutRequestID,
                'merchant_request_id' => $merchantRequestID,
            ],
        ]);

        Notification::create([
            'user_id' => $profile->user_id,
            'title' => 'M-Pesa Deposit Received',
            'message' => "KES {$amount} deposited via M-Pesa. Ref: {$mpesaRef}",
            'type' => 'transaction',
        ]);

        Log::info("M-Pesa deposit confirmed: {$mpesaRef}, KES {$amount} for user {$profile->user_id}");
        return response()->json(['success' => true]);
    }

    /**
     * POST /api/v1/webhooks/mpesa/b2c
     * Handles M-Pesa B2C (withdrawal) result callback
     */
    public function mpesaB2C(Request $request)
    {
        $payload = $request->all();
        Log::info('M-Pesa B2C callback', $payload);

        $result = $payload['Result'] ?? [];
        $resultCode = $result['ResultCode'] ?? -1;
        $conversationID = $result['ConversationID'] ?? '';
        $originatorConversationID = $result['OriginatorConversationID'] ?? '';

        // Find the pending withdrawal transaction
        $tx = Transaction::where('metadata->conversation_id', $conversationID)
            ->orWhere('metadata->originator_conversation_id', $originatorConversationID)
            ->where('type', 'withdraw')
            ->where('status', 'pending')
            ->first();

        if (!$tx) {
            Log::warning("M-Pesa B2C: no matching transaction for conversation {$conversationID}");
            return response()->json(['success' => true]);
        }

        if ($resultCode === 0) {
            // Success
            $tx->update(['status' => 'completed']);
            \App\Models\WithdrawalRequest::where('user_id', $tx->sender_user_id)
                ->where('status', 'processing')
                ->latest()
                ->first()
                ?->update(['status' => 'approved']);

            Notification::create([
                'user_id' => $tx->sender_user_id,
                'title' => 'Withdrawal Successful',
                'message' => "KES {$tx->amount} sent to your M-Pesa. Ref: {$tx->reference}",
                'type' => 'transaction',
            ]);
        } else {
            // Failed — refund balance
            $tx->update(['status' => 'failed']);
            $wallet = Wallet::find($tx->sender_wallet_id);
            if ($wallet) {
                $wallet->increment('balance', $tx->amount + $tx->fee);
            }

            Notification::create([
                'user_id' => $tx->sender_user_id,
                'title' => 'Withdrawal Failed',
                'message' => "Your withdrawal of KES {$tx->amount} failed. Amount refunded to wallet.",
                'type' => 'transaction',
            ]);
        }

        return response()->json(['success' => true]);
    }
}
