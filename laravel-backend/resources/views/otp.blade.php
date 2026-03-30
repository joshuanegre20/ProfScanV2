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
            {{-- Option 1: If you have a logo file --}}
            <img src="{{ asset('images/logo.png') }}" alt="ProfScan Logo" class="logo">
            
            {{-- Option 2: If you want to use text instead of logo --}}
            {{-- <h1>ProfScan</h1> --}}
            
            {{-- Option 3: If you have a base64 encoded logo --}}
            {{-- <img src="data:image/png;base64,{{ base64_encode(file_get_contents(public_path('images/logo.png'))) }}" alt="ProfScan Logo" class="logo"> --}}
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
                <a href="{{ config('app.url') }}" class="button">Go to ProfScan</a>
            </div>
        </div>
        
        <div class="footer">
            <p>© {{ date('Y') }} ProfScan. All rights reserved.</p>
            <p>If you have any questions, please contact our support team.</p>
        </div>
    </div>
</body>
</html>