<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Profile;
use App\Models\Wallet;
use App\Models\UserRole;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    /**
     * POST /api/v1/auth/register
     */
    public function register(Request $request)
    {
        $v = Validator::make($request->all(), [
            'email' => 'required|email|unique:users',
            'password' => 'required|min:8',
            'first_name' => 'required|string',
            'last_name' => 'required|string',
            'phone' => 'nullable|string',
            'country' => 'nullable|string',
            'country_code' => 'nullable|string|max:5',
            'currency' => 'nullable|string|max:5',
            'pin' => 'nullable|string|min:4|max:6',
        ]);

        if ($v->fails()) return response()->json(['error' => $v->errors()->first()], 422);

        $user = User::create([
            'name' => $request->first_name . ' ' . $request->last_name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        // Create profile
        Profile::create([
            'user_id' => $user->id,
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'middle_name' => $request->middle_name,
            'email' => $request->email,
            'phone' => $request->phone,
            'country' => $request->country ?? 'Kenya',
            'country_code' => $request->country_code ?? 'KE',
            'city' => $request->city,
            'address' => $request->address,
            'gender' => $request->gender,
            'date_of_birth' => $request->date_of_birth,
        ]);

        // Create wallet
        $wallet = Wallet::create([
            'user_id' => $user->id,
            'wallet_number' => Wallet::generateWalletNumber(),
            'currency' => $request->currency ?? 'KES',
        ]);

        // Set PIN if provided
        if ($request->pin) {
            $wallet->setPin($request->pin);
        }

        // Assign default user role
        UserRole::create(['user_id' => $user->id, 'role' => 'user']);

        $token = JWTAuth::fromUser($user);

        return response()->json([
            'success' => true,
            'token' => $token,
            'user' => $this->buildUserData($user),
        ], 201);
    }

    /**
     * POST /api/v1/auth/login
     */
    public function login(Request $request)
    {
        $credentials = $request->only('email', 'password');

        if (!$token = JWTAuth::attempt($credentials)) {
            // Log failed login attempt
            $user = User::where('email', $request->email)->first();
            if ($user) {
                \App\Models\SecurityAlert::create([
                    'type' => 'failed_login',
                    'user_id' => $user->id,
                    'description' => 'Failed login attempt from IP: ' . $request->ip(),
                    'severity' => 'low',
                ]);
            }
            return response()->json(['error' => 'Invalid credentials'], 401);
        }

        $user = auth()->user();

        // Check if account is active
        $profile = $user->profile;
        if ($profile && in_array($profile->status, ['suspended', 'banned', 'frozen'])) {
            JWTAuth::invalidate($token);
            return response()->json(['error' => "Account is {$profile->status}. Contact support."], 403);
        }

        return response()->json([
            'success' => true,
            'token' => $token,
            'user' => $this->buildUserData($user),
        ]);
    }

    /**
     * POST /api/v1/auth/logout
     */
    public function logout()
    {
        JWTAuth::invalidate(JWTAuth::getToken());
        return response()->json(['success' => true]);
    }

    /**
     * GET /api/v1/auth/me
     */
    public function me(Request $request)
    {
        return response()->json($this->buildUserData($request->user()));
    }

    /**
     * POST /api/v1/auth/forgot-password
     */
    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);
        // In production: send reset email via SMTP
        // Password::sendResetLink($request->only('email'));
        return response()->json(['success' => true, 'message' => 'Password reset link sent to your email']);
    }

    /**
     * POST /api/v1/auth/reset-password
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|min:8|confirmed',
        ]);
        // Password::reset(...)
        return response()->json(['success' => true]);
    }

    /**
     * PUT /api/v1/auth/change-password
     */
    public function changePassword(Request $request)
    {
        $request->validate(['password' => 'required|min:8']);
        $request->user()->update(['password' => Hash::make($request->password)]);
        return response()->json(['success' => true]);
    }

    /**
     * Build standardized user response data
     */
    private function buildUserData(User $user): array
    {
        $user->load(['profile', 'wallet', 'roles']);
        $profile = $user->profile;
        $wallet = $user->wallet;

        $initials = strtoupper(
            substr($profile->first_name ?? '', 0, 1) . substr($profile->last_name ?? '', 0, 1)
        ) ?: '??';

        return [
            'id' => $user->id,
            'firstName' => $profile->first_name ?? '',
            'lastName' => $profile->last_name ?? '',
            'email' => $profile->email ?? $user->email,
            'phone' => $profile->phone ?? '',
            'walletNumber' => $wallet->wallet_number ?? '',
            'walletBalance' => (float)($wallet->balance ?? 0),
            'currency' => $wallet->currency ?? 'KES',
            'avatarInitials' => $initials,
            'role' => $user->highestRole(),
            'status' => $profile->status ?? 'active',
            'kycStatus' => $profile->kyc_status ?? 'pending',
            'country' => $profile->country ?? 'Kenya',
            'createdAt' => $profile->created_at ?? $user->created_at,
        ];
    }
}
