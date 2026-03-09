<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Wallet;
use App\Models\Notification;
use App\Models\Profile;
use App\Models\ExchangeRate;
use App\Models\FeeConfig;
use Illuminate\Http\Request;

class WalletController extends Controller
{
    public function show(Request $request)
    {
        $wallet = Wallet::where('user_id', $request->user()->id)->first();
        return response()->json($wallet);
    }

    public function setPin(Request $request)
    {
        $request->validate([
            'pin' => 'required|string|min:4|max:6',
            'current_pin' => 'nullable|string',
        ]);

        $wallet = Wallet::where('user_id', $request->user()->id)->first();
        if (!$wallet) return response()->json(['error' => 'Wallet not found'], 404);

        // If PIN already set, verify current
        if ($wallet->pin_hash) {
            if (!$request->current_pin) return response()->json(['error' => 'Current PIN required'], 400);
            if (!$wallet->verifyPin($request->current_pin)) return response()->json(['error' => 'Current PIN is incorrect'], 403);
        }

        $wallet->setPin($request->pin);
        return response()->json(['success' => true]);
    }

    public function verifyPin(Request $request)
    {
        $request->validate(['pin' => 'required|string']);
        $wallet = Wallet::where('user_id', $request->user()->id)->first();
        if (!$wallet) return response()->json(['error' => 'Wallet not found'], 404);

        return response()->json(['valid' => $wallet->verifyPin($request->pin)]);
    }
}

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $notifications = Notification::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($notifications);
    }

    public function markRead(Request $request, string $id)
    {
        Notification::where('id', $id)->where('user_id', $request->user()->id)
            ->update(['read' => true]);
        return response()->json(['success' => true]);
    }
}

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        return response()->json($request->user()->profile);
    }

    public function update(Request $request)
    {
        $profile = Profile::where('user_id', $request->user()->id)->first();
        if (!$profile) return response()->json(['error' => 'Profile not found'], 404);

        $profile->update($request->only([
            'first_name', 'last_name', 'middle_name', 'phone',
            'city', 'address', 'gender', 'date_of_birth',
        ]));

        return response()->json(['success' => true, 'profile' => $profile->fresh()]);
    }

    public function uploadKyc(Request $request)
    {
        $request->validate([
            'id_front' => 'nullable|image|max:5120',
            'id_back' => 'nullable|image|max:5120',
            'selfie' => 'nullable|image|max:5120',
        ]);

        $profile = Profile::where('user_id', $request->user()->id)->first();
        $updates = [];

        foreach (['id_front' => 'id_front_url', 'id_back' => 'id_back_url', 'selfie' => 'selfie_url'] as $field => $col) {
            if ($request->hasFile($field)) {
                $path = $request->file($field)->store("kyc/{$request->user()->id}", 'public');
                $updates[$col] = "/storage/{$path}";
            }
        }

        if (!empty($updates)) {
            $profile->update($updates);
        }

        return response()->json(['success' => true]);
    }
}

class ExchangeRateController extends Controller
{
    public function index()
    {
        return response()->json(ExchangeRate::where('is_active', true)->get());
    }
}

class FeeController extends Controller
{
    public function index()
    {
        return response()->json(FeeConfig::where('is_active', true)->get());
    }
}
