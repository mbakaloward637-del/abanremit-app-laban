<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Wallet;
use App\Models\Transaction;
use App\Models\Notification;
use App\Models\FeeConfig;
use App\Models\Profile;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TransactionController extends Controller
{
    /**
     * GET /api/v1/transactions
     */
    public function index(Request $request)
    {
        $userId = $request->user()->id;
        $txns = Transaction::where('sender_user_id', $userId)
            ->orWhere('receiver_user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('limit', 50));

        return response()->json($txns);
    }

    /**
     * POST /api/v1/transactions/transfer
     */
    public function transfer(Request $request)
    {
        $request->validate([
            'recipient_wallet' => 'nullable|string',
            'recipient_phone' => 'nullable|string',
            'amount' => 'required|numeric|min:10|max:500000',
            'pin' => 'required|string|min:4|max:6',
        ]);

        $user = $request->user();
        $amount = (float)$request->amount;

        return DB::transaction(function () use ($user, $request, $amount) {
            $senderWallet = Wallet::where('user_id', $user->id)->lockForUpdate()->first();

            if (!$senderWallet) return response()->json(['success' => false, 'error' => 'Sender wallet not found'], 404);
            if ($senderWallet->is_locked) return response()->json(['success' => false, 'error' => 'Your wallet is locked. Contact support.'], 403);
            if (!$senderWallet->pin_hash) return response()->json(['success' => false, 'error' => 'Wallet PIN not set. Please set your PIN in Profile.'], 400);

            // Verify PIN
            if (!$senderWallet->verifyPin($request->pin)) {
                $senderWallet->increment('failed_pin_attempts');
                if ($senderWallet->failed_pin_attempts >= 5) {
                    $senderWallet->update(['is_locked' => true]);
                }
                return response()->json(['success' => false, 'error' => 'Invalid PIN'], 403);
            }

            // Reset failed attempts on success
            if ($senderWallet->failed_pin_attempts > 0) {
                $senderWallet->update(['failed_pin_attempts' => 0]);
            }

            // Find receiver
            $receiverWallet = null;
            if ($request->recipient_wallet) {
                $receiverWallet = Wallet::where('wallet_number', $request->recipient_wallet)->lockForUpdate()->first();
            } elseif ($request->recipient_phone) {
                $profile = Profile::where('phone', $request->recipient_phone)->first();
                if ($profile) $receiverWallet = Wallet::where('user_id', $profile->user_id)->lockForUpdate()->first();
            }

            if (!$receiverWallet) return response()->json(['success' => false, 'error' => 'Recipient not found'], 404);
            if ($senderWallet->id === $receiverWallet->id) return response()->json(['success' => false, 'error' => 'Cannot send to yourself'], 400);

            // Calculate fee
            $fee = $this->calculateFee('send', $amount);
            $totalDebit = $amount + $fee;

            if ($senderWallet->balance < $totalDebit) {
                return response()->json(['success' => false, 'error' => 'Insufficient balance'], 400);
            }

            // Execute transfer
            $senderWallet->decrement('balance', $totalDebit);
            $receiverWallet->increment('balance', $amount);

            $receiverName = '';
            $receiverProfile = Profile::where('user_id', $receiverWallet->user_id)->first();
            if ($receiverProfile) $receiverName = $receiverProfile->first_name . ' ' . $receiverProfile->last_name;

            $senderProfile = Profile::where('user_id', $user->id)->first();
            $senderName = $senderProfile ? $senderProfile->first_name . ' ' . $senderProfile->last_name : 'Unknown';

            $ref = 'TRF' . time() . str_pad(rand(0, 9999), 4, '0', STR_PAD_LEFT);

            // Sender transaction
            Transaction::create([
                'reference' => $ref, 'type' => 'send',
                'sender_user_id' => $user->id, 'sender_wallet_id' => $senderWallet->id,
                'receiver_user_id' => $receiverWallet->user_id, 'receiver_wallet_id' => $receiverWallet->id,
                'amount' => $amount, 'fee' => $fee, 'currency' => $senderWallet->currency,
                'description' => "Sent to {$receiverName}", 'status' => 'completed',
            ]);

            // Receiver transaction
            Transaction::create([
                'reference' => $ref . '-R', 'type' => 'receive',
                'sender_user_id' => $user->id, 'sender_wallet_id' => $senderWallet->id,
                'receiver_user_id' => $receiverWallet->user_id, 'receiver_wallet_id' => $receiverWallet->id,
                'amount' => $amount, 'fee' => 0, 'currency' => $senderWallet->currency,
                'description' => "Received from {$senderName}", 'status' => 'completed',
            ]);

            // Notify receiver
            Notification::create([
                'user_id' => $receiverWallet->user_id,
                'title' => 'Money Received',
                'message' => "You received {$senderWallet->currency} {$amount} from {$senderName}",
                'type' => 'transaction',
            ]);

            return response()->json([
                'success' => true,
                'reference' => $ref,
                'amount' => $amount,
                'fee' => $fee,
                'currency' => $senderWallet->currency,
                'recipient_name' => $receiverName,
                'new_balance' => $senderWallet->fresh()->balance,
            ]);
        });
    }

    /**
     * POST /api/v1/transactions/deposit
     */
    public function deposit(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'method' => 'required|in:card,mpesa,bank',
        ]);

        $user = $request->user();
        $wallet = Wallet::where('user_id', $user->id)->first();
        if (!$wallet) return response()->json(['error' => 'Wallet not found'], 404);

        $providerMap = ['card' => 'Paystack', 'mpesa' => 'M-Pesa', 'bank' => 'Bank Transfer'];
        $ref = 'DEP' . time();
        $amount = (float)$request->amount;

        // In production: initiate payment via provider, credit on webhook confirmation
        // For now: simulate immediate credit
        $wallet->increment('balance', $amount);

        Transaction::create([
            'reference' => $ref, 'type' => 'deposit',
            'receiver_user_id' => $user->id, 'receiver_wallet_id' => $wallet->id,
            'amount' => $amount, 'currency' => $wallet->currency,
            'description' => "{$providerMap[$request->method]} Deposit",
            'status' => 'completed', 'method' => $request->method,
            'provider' => $providerMap[$request->method],
        ]);

        return response()->json([
            'success' => true,
            'reference' => $ref,
            'amount' => $amount,
            'currency' => $wallet->currency,
            'new_balance' => $wallet->fresh()->balance,
        ]);
    }

    /**
     * POST /api/v1/transactions/withdraw
     */
    public function withdraw(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'method' => 'required|in:bank,mobile',
            'destination' => 'required|string',
            'pin' => 'required|string|min:4|max:6',
        ]);

        $user = $request->user();
        $wallet = Wallet::where('user_id', $user->id)->first();
        if (!$wallet) return response()->json(['error' => 'Wallet not found'], 404);

        if (!$wallet->verifyPin($request->pin)) {
            return response()->json(['success' => false, 'error' => 'Invalid PIN'], 403);
        }

        $amount = (float)$request->amount;
        $fee = $this->calculateFee('withdraw', $amount);
        $totalDebit = $amount + $fee;

        if ($wallet->balance < $totalDebit) {
            return response()->json(['success' => false, 'error' => 'Insufficient balance'], 400);
        }

        $wallet->decrement('balance', $totalDebit);
        $ref = 'WDR' . time();

        \App\Models\WithdrawalRequest::create([
            'user_id' => $user->id, 'wallet_id' => $wallet->id,
            'amount' => $amount, 'currency' => $wallet->currency,
            'method' => $request->method, 'destination' => $request->destination,
            'status' => 'pending',
        ]);

        Transaction::create([
            'reference' => $ref, 'type' => 'withdraw',
            'sender_user_id' => $user->id, 'sender_wallet_id' => $wallet->id,
            'amount' => $amount, 'fee' => $fee, 'currency' => $wallet->currency,
            'description' => "Withdrawal to {$request->destination}",
            'status' => 'pending', 'method' => $request->method,
        ]);

        return response()->json([
            'success' => true,
            'reference' => $ref,
            'amount' => $amount,
            'fee' => $fee,
        ]);
    }

    /**
     * POST /api/v1/transactions/airtime
     */
    public function airtime(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:10',
            'phone' => 'required|string',
            'network' => 'required|string',
        ]);

        $user = $request->user();
        $wallet = Wallet::where('user_id', $user->id)->first();
        if (!$wallet) return response()->json(['error' => 'Wallet not found'], 404);

        $amount = (float)$request->amount;
        if ($wallet->balance < $amount) {
            return response()->json(['success' => false, 'error' => 'Insufficient balance'], 400);
        }

        $wallet->decrement('balance', $amount);
        $ref = 'AIR' . time();

        Transaction::create([
            'reference' => $ref, 'type' => 'airtime',
            'sender_user_id' => $user->id, 'sender_wallet_id' => $wallet->id,
            'amount' => $amount, 'currency' => $wallet->currency,
            'description' => "{$request->network} airtime to {$request->phone}",
            'status' => 'completed', 'provider' => $request->network,
        ]);

        // TODO: Call airtime provider API (Africa's Talking / Reloadly)

        return response()->json([
            'success' => true,
            'reference' => $ref,
            'amount' => $amount,
        ]);
    }

    /**
     * POST /api/v1/transactions/exchange
     */
    public function exchange(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'from_currency' => 'required|string',
            'to_currency' => 'required|string',
        ]);

        $user = $request->user();
        $wallet = Wallet::where('user_id', $user->id)->first();
        if (!$wallet) return response()->json(['error' => 'Wallet not found'], 404);

        $amount = (float)$request->amount;
        if ($request->from_currency !== $wallet->currency) {
            return response()->json(['error' => 'Can only exchange from your wallet currency'], 400);
        }
        if ($wallet->balance < $amount) {
            return response()->json(['success' => false, 'error' => 'Insufficient balance'], 400);
        }

        $rate = \App\Models\ExchangeRate::where('from_currency', $request->from_currency)
            ->where('to_currency', $request->to_currency)
            ->where('is_active', true)->first();

        if (!$rate) return response()->json(['error' => 'Exchange rate not available'], 400);

        $converted = round($amount * $rate->rate, 2);
        $newBalance = $wallet->balance - $amount + $converted;
        $wallet->update(['balance' => $newBalance]);

        $ref = 'EXC' . time();
        Transaction::create([
            'reference' => $ref, 'type' => 'exchange',
            'sender_user_id' => $user->id, 'sender_wallet_id' => $wallet->id,
            'receiver_user_id' => $user->id, 'receiver_wallet_id' => $wallet->id,
            'amount' => $amount, 'currency' => $request->from_currency,
            'description' => "{$request->from_currency} → {$request->to_currency} Exchange",
            'status' => 'completed',
            'metadata' => ['to_currency' => $request->to_currency, 'rate' => $rate->rate, 'converted_amount' => $converted],
        ]);

        return response()->json([
            'success' => true,
            'reference' => $ref,
            'converted' => $converted,
            'rate' => $rate->rate,
        ]);
    }

    /**
     * POST /api/v1/recipients/lookup
     */
    public function lookupRecipient(Request $request)
    {
        $request->validate([
            'lookup_type' => 'required|in:wallet,phone',
            'lookup_value' => 'required|string',
        ]);

        if ($request->lookup_type === 'wallet') {
            $wallet = Wallet::where('wallet_number', $request->lookup_value)->first();
            if (!$wallet) return response()->json(['found' => false]);

            $profile = Profile::where('user_id', $wallet->user_id)->first();
            return response()->json([
                'found' => true,
                'name' => ($profile->first_name ?? '') . ' ' . ($profile->last_name ?? ''),
                'wallet' => $wallet->wallet_number,
                'user_id' => $wallet->user_id,
                'avatar_url' => $profile->avatar_url ?? null,
            ]);
        }

        // Phone lookup
        $profile = Profile::where('phone', $request->lookup_value)->first();
        if (!$profile) return response()->json(['found' => false]);

        $wallet = Wallet::where('user_id', $profile->user_id)->first();
        return response()->json([
            'found' => true,
            'name' => $profile->first_name . ' ' . $profile->last_name,
            'wallet' => $wallet->wallet_number ?? '',
            'user_id' => $profile->user_id,
            'avatar_url' => $profile->avatar_url,
        ]);
    }

    /**
     * Calculate fee for a transaction type
     */
    private function calculateFee(string $transactionType, float $amount): float
    {
        $config = FeeConfig::where('transaction_type', $transactionType)->where('is_active', true)->first();
        if (!$config) return 0;

        if ($config->fee_type === 'flat') return (float)($config->flat_amount ?? 0);
        if ($config->fee_type === 'percentage') return round($amount * ($config->percentage ?? 0) / 100, 2);
        return 0;
    }
}
