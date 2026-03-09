<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Wallet;
use App\Models\Transaction;
use App\Models\Notification;
use App\Models\FeeConfig;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AirtimeController extends Controller
{
    /**
     * POST /api/v1/airtime/purchase
     * Purchases airtime for Safaricom, Airtel, or Telkom
     */
    public function purchase(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:10|max:10000',
            'phone' => 'required|string',
            'network' => 'required|in:Safaricom,Airtel,Telkom',
        ]);

        $user = $request->user();
        $wallet = Wallet::where('user_id', $user->id)->first();
        if (!$wallet) return response()->json(['error' => 'Wallet not found'], 404);

        $amount = (float) $request->amount;

        // Calculate fee
        $feeConfig = FeeConfig::where('transaction_type', 'airtime')->where('is_active', true)->first();
        $fee = 0;
        if ($feeConfig) {
            $fee = $feeConfig->fee_type === 'flat'
                ? (float)($feeConfig->flat_amount ?? 0)
                : round($amount * ($feeConfig->percentage ?? 0) / 100, 2);
        }

        $totalDebit = $amount + $fee;
        if ($wallet->balance < $totalDebit) {
            return response()->json(['success' => false, 'error' => 'Insufficient balance'], 400);
        }

        $wallet->decrement('balance', $totalDebit);
        $ref = 'AIR' . time() . str_pad(rand(0, 9999), 4, '0', STR_PAD_LEFT);

        // Call Africa's Talking API if configured
        $providerStatus = 'completed';
        $providerResponse = null;

        $atApiKey = config('services.africastalking.api_key');
        $atUsername = config('services.africastalking.username');

        if ($atApiKey && $atUsername) {
            try {
                $atBaseUrl = config('services.africastalking.env') === 'production'
                    ? 'https://api.africastalking.com'
                    : 'https://api.sandbox.africastalking.com';

                $response = Http::withHeaders([
                    'apiKey' => $atApiKey,
                    'Accept' => 'application/json',
                ])->asForm()->post("{$atBaseUrl}/version1/airtime/send", [
                    'username' => $atUsername,
                    'recipients' => json_encode([[
                        'phoneNumber' => $this->formatPhone($request->phone),
                        'currencyCode' => 'KES',
                        'amount' => $amount,
                    ]]),
                ]);

                $providerResponse = $response->json();
                $entries = $providerResponse['responses'] ?? [];
                $entry = $entries[0] ?? [];

                if (($entry['status'] ?? '') !== 'Sent') {
                    $providerStatus = 'failed';
                    // Refund on failure
                    $wallet->increment('balance', $totalDebit);
                }
            } catch (\Exception $e) {
                Log::error('Africa\'s Talking airtime error: ' . $e->getMessage());
                $providerStatus = 'failed';
                $wallet->increment('balance', $totalDebit);
            }
        }

        // Create transaction record
        Transaction::create([
            'reference' => $ref,
            'type' => 'airtime',
            'sender_user_id' => $user->id,
            'sender_wallet_id' => $wallet->id,
            'amount' => $amount,
            'fee' => $fee,
            'currency' => $wallet->currency,
            'description' => "{$request->network} airtime to {$request->phone}",
            'status' => $providerStatus,
            'provider' => $request->network,
            'metadata' => [
                'phone' => $request->phone,
                'network' => $request->network,
                'provider_response' => $providerResponse,
            ],
        ]);

        // Notify user
        Notification::create([
            'user_id' => $user->id,
            'title' => $providerStatus === 'completed' ? 'Airtime Sent' : 'Airtime Failed',
            'message' => $providerStatus === 'completed'
                ? "KES {$amount} {$request->network} airtime sent to {$request->phone}"
                : "Failed to send airtime. Amount refunded to wallet.",
            'type' => 'transaction',
        ]);

        if ($providerStatus === 'failed') {
            return response()->json([
                'success' => false,
                'error' => 'Airtime purchase failed. Amount refunded.',
                'reference' => $ref,
            ], 400);
        }

        return response()->json([
            'success' => true,
            'reference' => $ref,
            'amount' => $amount,
            'fee' => $fee,
            'network' => $request->network,
            'phone' => $request->phone,
            'new_balance' => $wallet->fresh()->balance,
        ]);
    }

    /**
     * GET /api/v1/airtime/networks
     * Returns supported airtime networks
     */
    public function networks()
    {
        return response()->json([
            ['id' => 'safaricom', 'name' => 'Safaricom', 'min' => 10, 'max' => 10000],
            ['id' => 'airtel', 'name' => 'Airtel', 'min' => 10, 'max' => 10000],
            ['id' => 'telkom', 'name' => 'Telkom', 'min' => 10, 'max' => 10000],
        ]);
    }

    private function formatPhone(string $phone): string
    {
        $phone = preg_replace('/[^0-9]/', '', $phone);
        if (str_starts_with($phone, '0')) $phone = '+254' . substr($phone, 1);
        if (!str_starts_with($phone, '+')) $phone = '+' . $phone;
        return $phone;
    }
}
