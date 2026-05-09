<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Models\User;
use Tymon\JWTAuth\Facades\JWTAuth;
use Illuminate\Support\Facades\Mail;
use App\Mail\OtpMail;
use App\Mail\LoginAlertMail;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use App\Models\Setting;

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
                'message' => 'Identity verified successfully!'
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
            // Check if email is already verified and trying to change
            if ($user->is_verified && $user->email !== $request->email) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot change email address once verified. Please contact administrator for assistance.'
                ], 403);
            }
            
            $oldEmail = $user->email;
            $newEmail = $request->email;
            
            // Update the user
            $user->name = $request->name;
            $user->department = $request->department;
            $user->specialization = $request->specialization;
            
            // Only update email if it's different AND user is not verified
            if ($oldEmail !== $newEmail && !$user->is_verified) {
                $user->email = $newEmail;
                // Keep is_verified as false since email changed
                $user->is_verified = false;
                $user->email_verified_at = null;
            }
            
            $user->save();
            
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
        
        // Check if account is deactivated
        if ($user->status === 'Deactivate' || $user->status === 'deactivated' ) {
            auth('api')->logout();
            return response()->json(['message' => 'Account is deactivated. Please contact administrator.'], 403);
        }

        // Update user status to Active after successful login
        $user->status = 'Active';
        
        // Also update scan_status if the column exists (for instructors)
        if (Schema::hasColumn('users', 'scan_status')) {
            $user->scan_status = 'online';
        }
        
        // Update last_login_at if column exists
        if (Schema::hasColumn('users', 'last_login_at')) {
            $user->last_login_at = now();
        }
        
        $user->save();
        
        Log::info("User logged in: {$user->email} - Status updated to Active");

        // Check if login notifications are enabled for admin users
        if ($user->role === 'admin') {
            $setting = Setting::where('key', 'notifyLogin')->first();
            $notifyLogin = $setting ? ($setting->value === 'true' || $setting->value === true) : true;
            
            if ($notifyLogin) {
                try {
                    // Send login alert email using the LoginAlertMail class
                    Mail::to($user->email)->send(new LoginAlertMail(
                        $user->name,
                        $user->email,
                        now()->setTimezone('Asia/Manila')->format('Y-m-d H:i:s'),
                        $request->ip(),
                        $request->userAgent() ?? 'Unknown'
                    ));
                    
                    Log::info("Login alert email sent to admin: {$user->email}");
                } catch (\Exception $e) {
                    Log::error("Failed to send login alert email: " . $e->getMessage());
                }
            }
        }
        
        // Return user data with token
        return response()->json([
            'token' => $token,
            'role' => $user->role,
            'name' => $user->name,
            'email' => $user->email,
            'instructor_id' => $user->instructor_id ?? null,
            'staff_id' => $user->staff_id ?? null,
            'status' => $user->status,
        ]);
        
    } catch (\Exception $e) {
        Log::error('Login error: ' . $e->getMessage());
        return response()->json(['message' => 'Login failed. Please try again.'], 500);
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
            // Update user status to Inactive when logging out
            $user->status = 'Inactive';
            
            // Update scan_status if column exists
            if (Schema::hasColumn('users', 'scan_status')) {
                $user->scan_status = 'offline';
            }
            
            $user->save();
            
            Log::info("User logged out: {$user->email} - Status updated to Inactive");
        }
        
        // Revoke the token
        auth('api')->logout();
        
        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully'
        ]);
        
    } catch (\Exception $e) {
        Log::error('Logout error: ' . $e->getMessage());
        return response()->json([
            'success' => false,
            'message' => 'Logout failed'
        ], 500);
    }
}

    public function sendResetOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp' => 'required|integer|digits:6'
        ]);

        $user = User::where('email', $request->email)->first();
        
        if (!$user) {
            return response()->json([
                'success' => false, 
                'message' => 'No account found with this email address'
            ], 404);
        }

        try {
            // Store OTP in cache with 10 minutes expiration
            Cache::put('reset_otp_' . $user->email, $request->otp, now()->addMinutes(10));
            
            // Send email with OTP
            Mail::to($user->email)->send(new OtpMail($request->otp, 'password_reset'));
            
            return response()->json([
                'success' => true,
                'message' => 'Verification code sent to ' . $user->email
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send reset OTP: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to send verification code: ' . $e->getMessage()
            ], 500);
        }
    }

    // Verify reset OTP
    public function verifyResetOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp' => 'required|integer|digits:6',
        ]);

        $user = User::where('email', $request->email)->first();
        
        if (!$user) {
            return response()->json([
                'success' => false, 
                'message' => 'User not found'
            ], 404);
        }

        $storedOtp = Cache::get('reset_otp_' . $user->email);
        
        if (!$storedOtp || $storedOtp != $request->otp) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired verification code'
            ], 400);
        }

        // Generate a temporary token for password reset
        $token = bin2hex(random_bytes(32));
        Cache::put('reset_token_' . $user->email, $token, now()->addMinutes(15));

        return response()->json([
            'success' => true,
            'message' => 'Verification successful',
            'token' => $token
        ]);
    }

    // Reset password
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => 'required|min:8|confirmed',
        ]);

        $user = User::where('email', $request->email)->first();
        
        if (!$user) {
            return response()->json([
                'success' => false, 
                'message' => 'User not found'
            ], 404);
        }

        $storedToken = Cache::get('reset_token_' . $user->email);
        
        if (!$storedToken || $storedToken !== $request->token) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired reset token'
            ], 400);
        }

        // Update password
        $user->password = Hash::make($request->password);
        $user->save();

        // Clear cache
        Cache::forget('reset_otp_' . $user->email);
        Cache::forget('reset_token_' . $user->email);

        return response()->json([
            'success' => true,
            'message' => 'Password reset successfully'
        ]);
    }
}