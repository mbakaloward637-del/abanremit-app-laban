<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\{
    Profile, Wallet, Transaction, WithdrawalRequest, Notification,
    ActivityLog, SecurityAlert, SupportTicket, ExchangeRate, FeeConfig,
    PaymentGateway, PlatformConfig, UserRole
};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    // ─── Dashboard Stats ───
    public function dashboard()
    {
        $totalUsers = Profile::count();
        $activeWallets = Wallet::count();
        $totalBalance = Wallet::sum('balance');
        $pendingKyc = Profile::where('kyc_status', 'pending')->count();
        $pendingWithdrawals = WithdrawalRequest::where('status', 'pending')->count();
        $recentTxns = Transaction::orderBy('created_at', 'desc')->limit(10)->get();

        return response()->json(compact(
            'totalUsers', 'activeWallets', 'totalBalance',
            'pendingKyc', 'pendingWithdrawals', 'recentTxns'
        ));
    }

    // ─── Users ───
    public function users(Request $request)
    {
        $profiles = Profile::orderBy('created_at', 'desc')->get();
        $wallets = Wallet::all()->keyBy('user_id');

        $data = $profiles->map(function ($p) use ($wallets) {
            $w = $wallets[$p->user_id] ?? null;
            return array_merge($p->toArray(), [
                'walletNumber' => $w->wallet_number ?? '',
                'balance' => (float)($w->balance ?? 0),
                'currency' => $w->currency ?? 'KES',
            ]);
        });

        return response()->json($data);
    }

    public function userDetail(string $userId)
    {
        $profile = Profile::where('user_id', $userId)->firstOrFail();
        $wallet = Wallet::where('user_id', $userId)->first();
        $roles = UserRole::where('user_id', $userId)->pluck('role');

        return response()->json([
            'profile' => $profile,
            'wallet' => $wallet,
            'roles' => $roles,
        ]);
    }

    public function updateUserStatus(Request $request, string $userId)
    {
        $request->validate(['status' => 'required|in:active,frozen,suspended,banned']);
        Profile::where('user_id', $userId)->update(['status' => $request->status]);

        ActivityLog::create([
            'actor_id' => $request->user()->id,
            'action' => "user_status_change:{$request->status}",
            'target' => $userId,
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['success' => true]);
    }

    public function resetUserPassword(Request $request, string $userId)
    {
        // In production: send password reset email to user
        ActivityLog::create([
            'actor_id' => $request->user()->id,
            'action' => 'admin_reset_password',
            'target' => $userId,
            'ip_address' => $request->ip(),
        ]);
        return response()->json(['success' => true, 'message' => 'Password reset link sent']);
    }

    public function resetUserPin(Request $request, string $userId)
    {
        $wallet = Wallet::where('user_id', $userId)->first();
        if ($wallet) {
            $wallet->update(['pin_hash' => null, 'failed_pin_attempts' => 0, 'is_locked' => false]);
        }

        ActivityLog::create([
            'actor_id' => $request->user()->id,
            'action' => 'admin_reset_pin',
            'target' => $userId,
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['success' => true]);
    }

    // ─── Transactions ───
    public function transactions()
    {
        return response()->json(Transaction::orderBy('created_at', 'desc')->limit(200)->get());
    }

    public function flagTransaction(Request $request, string $id)
    {
        Transaction::where('id', $id)->update(['status' => 'flagged']);
        return response()->json(['success' => true]);
    }

    public function reverseTransaction(Request $request, string $id)
    {
        $request->validate(['reason' => 'nullable|string']);

        return DB::transaction(function () use ($request, $id) {
            $tx = Transaction::findOrFail($id);
            $admin = $request->user();

            if ($tx->type !== 'send') return response()->json(['success' => false, 'error' => 'Only send transactions can be reversed'], 400);
            if ($tx->status !== 'completed') return response()->json(['success' => false, 'error' => 'Only completed transactions can be reversed'], 400);

            $senderWallet = Wallet::lockForUpdate()->find($tx->sender_wallet_id);
            $receiverWallet = Wallet::lockForUpdate()->find($tx->receiver_wallet_id);

            if (!$senderWallet || !$receiverWallet) return response()->json(['success' => false, 'error' => 'Wallet not found'], 404);
            if ($receiverWallet->balance < $tx->amount) return response()->json(['success' => false, 'error' => 'Receiver has insufficient balance for reversal'], 400);

            // Execute reversal
            $receiverWallet->decrement('balance', $tx->amount);
            $senderWallet->increment('balance', $tx->amount + $tx->fee);

            // Mark as reversed
            $tx->update(['status' => 'reversed']);
            Transaction::where('reference', $tx->reference . '-R')->update(['status' => 'reversed']);

            $reason = $request->reason ?? 'Admin reversal';
            $revRef = 'REV' . time() . str_pad(rand(0, 9999), 4, '0', STR_PAD_LEFT);

            // Reversal record
            Transaction::create([
                'reference' => $revRef, 'type' => 'send',
                'sender_user_id' => $tx->receiver_user_id, 'sender_wallet_id' => $receiverWallet->id,
                'receiver_user_id' => $tx->sender_user_id, 'receiver_wallet_id' => $senderWallet->id,
                'amount' => $tx->amount, 'fee' => 0, 'currency' => $tx->currency,
                'description' => "Reversal: {$reason} (Ref: {$tx->reference})",
                'status' => 'completed',
                'metadata' => ['reversal' => true, 'original_reference' => $tx->reference, 'admin_id' => $admin->id, 'reason' => $reason],
            ]);

            // Notify both parties
            Notification::insert([
                ['id' => \Illuminate\Support\Str::uuid(), 'user_id' => $tx->sender_user_id, 'title' => 'Transaction Reversed', 'message' => "{$tx->currency} {$tx->amount} reversed back to your wallet. Ref: {$tx->reference}", 'type' => 'transaction', 'read' => false, 'created_at' => now(), 'updated_at' => now()],
                ['id' => \Illuminate\Support\Str::uuid(), 'user_id' => $tx->receiver_user_id, 'title' => 'Transaction Reversed', 'message' => "{$tx->currency} {$tx->amount} was reversed from your wallet. Ref: {$tx->reference}", 'type' => 'transaction', 'read' => false, 'created_at' => now(), 'updated_at' => now()],
            ]);

            ActivityLog::create([
                'actor_id' => $admin->id, 'action' => 'reverse_transaction', 'target' => $id,
                'ip_address' => $request->ip(),
                'metadata' => ['reason' => $reason, 'amount' => $tx->amount, 'currency' => $tx->currency, 'reversal_ref' => $revRef],
            ]);

            return response()->json([
                'success' => true,
                'reversal_reference' => $revRef,
                'amount' => $tx->amount,
                'fee_refunded' => $tx->fee,
                'currency' => $tx->currency,
            ]);
        });
    }

    // ─── Withdrawals ───
    public function withdrawals()
    {
        return response()->json(WithdrawalRequest::orderBy('created_at', 'desc')->get());
    }

    public function updateWithdrawal(Request $request, string $id)
    {
        $request->validate(['status' => 'required|in:approved,rejected,processing']);
        $wr = WithdrawalRequest::findOrFail($id);
        $wr->update([
            'status' => $request->status,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        // If rejected, refund balance
        if ($request->status === 'rejected') {
            $wallet = Wallet::find($wr->wallet_id);
            if ($wallet) $wallet->increment('balance', $wr->amount);
        }

        return response()->json(['success' => true]);
    }

    // ─── KYC ───
    public function pendingKyc()
    {
        return response()->json(Profile::where('kyc_status', 'pending')->get());
    }

    public function updateKyc(Request $request, string $id)
    {
        $request->validate(['status' => 'required|in:approved,rejected']);
        Profile::where('id', $id)->update(['kyc_status' => $request->status]);
        return response()->json(['success' => true]);
    }

    // ─── Notifications ───
    public function sendNotification(Request $request)
    {
        $request->validate([
            'user_id' => 'required',
            'title' => 'required|string',
            'message' => 'required|string',
        ]);

        Notification::create($request->only(['user_id', 'title', 'message', 'type']));
        return response()->json(['success' => true]);
    }

    // ─── Logs ───
    public function activityLogs()
    {
        return response()->json(ActivityLog::orderBy('created_at', 'desc')->limit(200)->get());
    }

    // ─── Security Alerts ───
    public function securityAlerts()
    {
        return response()->json(SecurityAlert::orderBy('created_at', 'desc')->get());
    }

    public function resolveAlert(Request $request, string $id)
    {
        SecurityAlert::where('id', $id)->update(['resolved' => true, 'resolved_by' => $request->user()->id]);
        return response()->json(['success' => true]);
    }

    // ─── Support Tickets ───
    public function supportTickets()
    {
        return response()->json(SupportTicket::orderBy('created_at', 'desc')->get());
    }

    public function updateTicket(Request $request, string $id)
    {
        $request->validate(['status' => 'required|in:open,in_progress,resolved,escalated']);
        SupportTicket::where('id', $id)->update(['status' => $request->status]);
        return response()->json(['success' => true]);
    }

    // ─── Super Admin: Exchange Rates ───
    public function getExchangeRates() { return response()->json(ExchangeRate::all()); }
    public function createExchangeRate(Request $request)
    {
        $request->validate(['from_currency' => 'required', 'to_currency' => 'required', 'rate' => 'required|numeric']);
        $rate = ExchangeRate::create(array_merge($request->all(), ['updated_by' => $request->user()->id]));
        return response()->json($rate, 201);
    }
    public function updateExchangeRate(Request $request, string $id)
    {
        ExchangeRate::where('id', $id)->update(array_merge($request->only(['rate', 'margin_percent', 'is_active']), ['updated_by' => $request->user()->id]));
        return response()->json(['success' => true]);
    }
    public function deleteExchangeRate(string $id)
    {
        ExchangeRate::destroy($id);
        return response()->json(['success' => true]);
    }

    // ─── Super Admin: Fees ───
    public function getFees() { return response()->json(FeeConfig::all()); }
    public function createFee(Request $request)
    {
        $fee = FeeConfig::create(array_merge($request->all(), ['updated_by' => $request->user()->id]));
        return response()->json($fee, 201);
    }
    public function updateFee(Request $request, string $id)
    {
        FeeConfig::where('id', $id)->update(array_merge($request->except('id'), ['updated_by' => $request->user()->id]));
        return response()->json(['success' => true]);
    }

    // ─── Super Admin: Payment Gateways ───
    public function getPaymentGateways() { return response()->json(PaymentGateway::all()); }
    public function updatePaymentGateway(Request $request, string $id)
    {
        PaymentGateway::where('id', $id)->update(array_merge($request->except('id'), ['updated_by' => $request->user()->id]));
        return response()->json(['success' => true]);
    }

    // ─── Super Admin: Platform Config ───
    public function getConfig() { return response()->json(PlatformConfig::all()); }
    public function updateConfig(Request $request)
    {
        $request->validate(['key' => 'required', 'value' => 'required']);
        PlatformConfig::updateOrCreate(
            ['key' => $request->key],
            ['value' => $request->value, 'updated_by' => $request->user()->id]
        );
        return response()->json(['success' => true]);
    }

    // ─── Super Admin: User Roles ───
    public function getRoles(string $userId)
    {
        return response()->json(UserRole::where('user_id', $userId)->get());
    }

    public function assignRole(Request $request)
    {
        $request->validate(['user_id' => 'required', 'role' => 'required|in:user,admin,superadmin']);
        UserRole::firstOrCreate(['user_id' => $request->user_id, 'role' => $request->role]);
        return response()->json(['success' => true]);
    }

    public function removeRole(Request $request, string $id)
    {
        UserRole::destroy($id);
        return response()->json(['success' => true]);
    }
}
