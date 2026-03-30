<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Models\User;
use Tymon\JWTAuth\Facades\JWTAuth;
use Illuminate\Support\Facades\Mail;
use App\Mail\OtpMail;
use Illuminate\Support\Facades\Cache; // Add this for storing OTPs

class AuthController extends Controller
{
    // Send OTP for email verification
    public function sendVerificationCode(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp' => 'required|integer|digits:6'
        ]);

        $user = User::where('email', $request->email)->first();
        
        if (!$user) {
            return response()->json([
                'success' => false, 
                'message' => 'User not found'
            ], 404);
        }

        try {
            // Store OTP in cache with 10 minutes expiration
            Cache::put('otp_' . $user->email, $request->otp, now()->addMinutes(10));
            
            // Send email with OTP
            Mail::to($user->email)->send(new OtpMail($request->otp));
            
            return response()->json([
                'success' => true,
                'message' => 'Verification code sent to ' . $user->email
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send OTP: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to send verification code: ' . $e->getMessage()
            ], 500);
        }
    }

    // Resend OTP
    public function resendVerification(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp' => 'required|integer|digits:6'
        ]);

        $user = User::where('email', $request->email)->first();
        
        if (!$user) {
            return response()->json([
                'success' => false, 
                'message' => 'User not found'
            ], 404);
        }

        try {
            // Update OTP in cache
            Cache::put('otp_' . $user->email, $request->otp, now()->addMinutes(10));
            
            // Send email with new OTP
            Mail::to($user->email)->send(new OtpMail($request->otp));
            
            return response()->json([
                'success' => true,
                'message' => 'New verification code sent to ' . $user->email
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to resend code: ' . $e->getMessage()
            ], 500);
        }
    }

    // Verify OTP and update email verification status
    public function verifyEmail(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp' => 'required|integer|digits:6',
            'verified' => 'sometimes|boolean'
        ]);

        $user = User::where('email', $request->email)->first();
        
        if (!$user) {
            return response()->json([
                'success' => false, 
                'message' => 'User not found'
            ], 404);
        }

        // Get stored OTP from cache
        $storedOtp = Cache::get('otp_' . $user->email);
        
        if (!$storedOtp) {
            return response()->json([
                'success' => false,
                'message' => 'Verification code expired. Please request a new one.'
            ], 400);
        }

        if ($storedOtp != $request->otp) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid verification code. Please try again.'
            ], 400);
        }

        try {
            // Update user's email verification status
            $user->is_verified = true;
            $user->email_verified_at = now();
            $user->save();
            
            // Clear the OTP from cache
            Cache::forget('otp_' . $user->email);
            
            return response()->json([
                'success' => true,
                'message' => 'Email verified successfully!'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to verify email: ' . $e->getMessage()
            ], 500);
        }
    }

    // Update profile with email verification
    public function updateProfile(Request $request)
    {
        $user = auth()->user();
        
        $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'department' => 'nullable|string',
            'specialization' => 'nullable|string'
        ]);
        
        try {
            $oldEmail = $user->email;
            $newEmail = $request->email;
            
            // If email changed, reset verification status
            if ($oldEmail !== $newEmail) {
                $user->is_verified = false;
                $user->email_verified_at = null;
            }
            
            $user->update($request->all());
            
            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully',
                'user' => $user
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update profile: ' . $e->getMessage()
            ], 500);
        }
    }

    public function login(Request $request)
    {
        try {
            $credentials = $request->validate([
                'email'    => 'required|email',
                'password' => 'required',
            ]);

            if (!$token = auth('api')->attempt($credentials)) {
                return response()->json(['message' => 'Invalid credentials'], 401);
            }

            $user = auth('api')->user();
            
            if ($user->status === 'Deactivate' || $user->status === 'deactivated') {
                auth('api')->logout();
                return response()->json(['message' => 'Account is deactivated. Please contact administrator.'], 403);
            }

            return response()->json([
                'token' => $token,
                'role'  => $user->role,
                'name'  => $user->name,
                'id'    => $user->id,
                'email' => $user->email,
                'instructor_id' => $user->instructor_id ?? null,
                'staff_id'      => $user->staff_id ?? null,
                'status'        => $user->status ?? "Active",
                'is_verified'   => $user->is_verified ?? false
            ]);
            
        } catch (\Exception $e) {
            Log::error('Login error: ' . $e->getMessage());
            return response()->json(['message' => 'Login failed: ' . $e->getMessage()], 500);
        }
    }

    public function me(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json(['message' => 'User not found'], 404);
            }
            
            return response()->json([
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'status' => $user->status,
                'instructor_id' => $user->instructor_id ?? null,
                'staff_id' => $user->staff_id ?? null,
                'department' => $user->department ?? null,
                'specialization' => $user->specialization ?? null,
                'profile_url' => $user->profile_url ?? null,
                'qr_payload' => $user->qr_payload ?? null,
                'is_verified' => $user->is_verified ?? false,
                'email_verified_at' => $user->email_verified_at
            ]);
        } catch (\Exception $e) {
            Log::error('Me endpoint error: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to get user data'], 500);
        }
    }

    public function logout(Request $request)
    {
        try {
            $user = $request->user();
            
            if ($user) {
                $user->update(['status' => 'Active']);
            }
            
            auth('api')->logout();
            
            return response()->json(['message' => 'Logged out successfully']);
        } catch (\Exception $e) {
            Log::error('Logout error: ' . $e->getMessage());
            return response()->json(['message' => 'Logout failed'], 500);
        }
    }
}