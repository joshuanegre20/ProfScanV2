<!DOCTYPE html>
<html>
<head>
    <title>Your Verification Code - ProfScan</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            background: #003366;
            padding: 30px 20px;
            text-align: center;
        }
        .logo {
            max-width: 150px;
            height: auto;
            margin-bottom: 10px;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            color: #333;
            margin-bottom: 20px;
        }
        .message {
            color: #666;
            margin-bottom: 30px;
        }
        .code-container {
            text-align: center;
            margin: 30px 0;
        }
        .code {
            font-size: 36px;
            font-weight: bold;
            text-align: center;
            padding: 20px;
            background: #f5f5f5;
            border-radius: 8px;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
            color: #003366;
            display: inline-block;
            min-width: 280px;
        }
        .expiry {
            text-align: center;
            font-size: 14px;
            color: #999;
            margin-top: 20px;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        .footer p {
            margin: 5px 0;
            font-size: 12px;
            color: #6c757d;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background: #003366;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            margin-top: 20px;
        }
        @media only screen and (max-width: 600px) {
            .content {
                padding: 20px;
            }
            .code {
                font-size: 28px;
                letter-spacing: 5px;
                min-width: 240px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <!-- OPTION 1: Using external API URL (Best for production) -->
            <img src="https://api.captoneproject101.online/api/logo" alt="ProfScan Logo" class="logo" style="display: block; margin: 0 auto;">
            
            <!-- OPTION 2: Using Laravel asset (if logo is stored locally) -->
            {{-- <img src="{{ asset('storage/logo/tmclogo2.png') }}" alt="ProfScan Logo" class="logo"> --}}
            
            <!-- OPTION 3: Using public path -->
            {{-- <img src="{{ public_path('images/logo.png') }}" alt="ProfScan Logo" class="logo"> --}}
            
            <!-- Fallback text if logo fails to load -->
            <div style="display: none;" class="logo-fallback">
                <h1 style="color: #ffffff; margin: 0;">ProfScan</h1>
                <p style="color: #ffd700; margin: 5px 0 0; font-size: 12px;">Trinidad Municipal College</p>
            </div>
        </div>
        
        <div class="content">
            <div class="greeting">
                Hello {{ $userName ?? 'User' }}!
            </div>
            
            <div class="message">
                You requested to verify your email address for ProfScan. Please use the verification code below to complete your verification:
            </div>
            
            <div class="code-container">
                <div class="code">
                    {{ $otp }}
                </div>
            </div>
            
            <div class="message">
                This code will expire in <strong>10 minutes</strong>. If you didn't request this verification, please ignore this email.
            </div>
            
            <div style="text-align: center;">
                <a href="https://web.captoneproject101.online/instructor/dashboard" class="button">Go to ProfScan</a>
            </div>
        </div>
        
        <div class="footer">
            <p>© {{ date('Y') }} ProfScan. All rights reserved.</p>
            <p>Trinidad Municipal College</p>
            <p>If you have any questions, please contact our support team.</p>
        </div>
    </div>
    
    <script>
        // Fallback: If logo fails to load, show text version
        document.addEventListener('DOMContentLoaded', function() {
            const logoImg = document.querySelector('.logo');
            if (logoImg) {
                logoImg.onerror = function() {
                    this.style.display = 'none';
                    const fallback = document.querySelector('.logo-fallback');
                    if (fallback) fallback.style.display = 'block';
                };
            }
        });
    </script>
</body>
</html>