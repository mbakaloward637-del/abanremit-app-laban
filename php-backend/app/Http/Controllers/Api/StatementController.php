<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Wallet;
use App\Models\Transaction;
use App\Models\Profile;
use App\Models\Notification;
use Illuminate\Http\Request;

class StatementController extends Controller
{
    /**
     * POST /api/v1/statements/download
     * Charges 50 KES fee and returns CSV statement
     */
    public function download(Request $request)
    {
        $request->validate([
            'from_date' => 'required|date',
            'to_date' => 'required|date|after_or_equal:from_date',
            'format' => 'nullable|in:csv,pdf',
        ]);

        $user = $request->user();
        $wallet = Wallet::where('user_id', $user->id)->first();
        if (!$wallet) return response()->json(['error' => 'Wallet not found'], 404);

        // Statement fee: 50 KES
        $fee = 50.00;
        if ($wallet->balance < $fee) {
            return response()->json(['success' => false, 'error' => 'Insufficient balance for statement fee (KES 50)'], 400);
        }

        // Deduct fee
        $wallet->decrement('balance', $fee);

        $ref = 'STM' . time() . str_pad(rand(0, 999), 3, '0', STR_PAD_LEFT);
        Transaction::create([
            'reference' => $ref,
            'type' => 'withdraw',
            'sender_user_id' => $user->id,
            'sender_wallet_id' => $wallet->id,
            'amount' => $fee,
            'fee' => 0,
            'currency' => $wallet->currency,
            'description' => 'Statement download fee',
            'status' => 'completed',
            'method' => 'internal',
        ]);

        // Fetch transactions in date range
        $transactions = Transaction::where(function ($q) use ($user) {
            $q->where('sender_user_id', $user->id)
              ->orWhere('receiver_user_id', $user->id);
        })
        ->whereBetween('created_at', [$request->from_date, $request->to_date . ' 23:59:59'])
        ->orderBy('created_at', 'desc')
        ->get();

        $profile = Profile::where('user_id', $user->id)->first();
        $accountName = ($profile->first_name ?? '') . ' ' . ($profile->last_name ?? '');

        // Build CSV
        $csv = "AbanRemit Account Statement\n";
        $csv .= "Account: {$wallet->wallet_number}\n";
        $csv .= "Name: {$accountName}\n";
        $csv .= "Period: {$request->from_date} to {$request->to_date}\n";
        $csv .= "Generated: " . now()->toDateTimeString() . "\n\n";
        $csv .= "Date,Reference,Type,Description,Amount,Fee,Currency,Status\n";

        foreach ($transactions as $tx) {
            $date = $tx->created_at->format('Y-m-d H:i:s');
            $desc = str_replace(',', ';', $tx->description ?? '');
            $csv .= "{$date},{$tx->reference},{$tx->type},{$desc},{$tx->amount},{$tx->fee},{$tx->currency},{$tx->status}\n";
        }

        $csv .= "\nTotal transactions: {$transactions->count()}\n";
        $csv .= "Statement fee: KES {$fee}\n";

        // Notify user
        Notification::create([
            'user_id' => $user->id,
            'title' => 'Statement Downloaded',
            'message' => "Account statement for {$request->from_date} to {$request->to_date} generated. Fee: KES {$fee}",
            'type' => 'info',
        ]);

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=statement_{$request->from_date}_{$request->to_date}.csv",
        ]);
    }

    /**
     * GET /api/v1/statements/preview
     * Preview statement data without charging (returns JSON)
     */
    public function preview(Request $request)
    {
        $request->validate([
            'from_date' => 'required|date',
            'to_date' => 'required|date|after_or_equal:from_date',
        ]);

        $user = $request->user();

        $transactions = Transaction::where(function ($q) use ($user) {
            $q->where('sender_user_id', $user->id)
              ->orWhere('receiver_user_id', $user->id);
        })
        ->whereBetween('created_at', [$request->from_date, $request->to_date . ' 23:59:59'])
        ->orderBy('created_at', 'desc')
        ->get();

        $totalIn = $transactions->where('receiver_user_id', $user->id)->sum('amount');
        $totalOut = $transactions->where('sender_user_id', $user->id)->sum('amount');

        return response()->json([
            'transaction_count' => $transactions->count(),
            'total_in' => round($totalIn, 2),
            'total_out' => round($totalOut, 2),
            'fee' => 50.00,
            'currency' => 'KES',
            'from_date' => $request->from_date,
            'to_date' => $request->to_date,
        ]);
    }
}
