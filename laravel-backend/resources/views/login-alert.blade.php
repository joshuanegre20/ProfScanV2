<!DOCTYPE html>
<html>
<head>
    <title>Admin Login Alert - ProfScan</title>
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
            display: block;
            margin: 0 auto 10px;
        }
        .header h1 {
            color: #ffffff;
            margin: 10px 0 0;
            font-size: 22px;
            font-weight: 600;
        }
        .header p {
            color: #ffd700;
            margin: 4px 0 0;
            font-size: 13px;
        }
        .content {
            padding: 40px 30px;
        }
        .alert-badge {
            text-align: center;
            margin-bottom: 24px;
        }
        .alert-badge span {
            display: inline-block;
            background: #fff3cd;
            color: #92400e;
            border: 1px solid #f59e0b;
            border-radius: 999px;
            padding: 6px 18px;
            font-size: 13px;
            font-weight: 600;
        }
        .greeting {
            font-size: 18px;
            color: #333;
            margin-bottom: 12px;
        }
        .message {
            color: #666;
            margin-bottom: 24px;
            font-size: 15px;
        }
        .details {
            background: #f8fafc;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            border: 1px solid #e2e8f0;
        }
        .detail-row {
            display: flex;
            padding: 10px 0;
            border-bottom: 1px solid #e2e8f0;
            font-size: 14px;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            width: 140px;
            font-weight: 600;
            color: #475569;
            flex-shrink: 0;
        }
        .detail-value {
            flex: 1;
            color: #1e293b;
            word-break: break-word;
        }
        .warning {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin-top: 20px;
            border-radius: 8px;
        }
        .warning p {
            margin: 0;
            color: #92400e;
            font-size: 14px;
        }
        .button {
            display: inline-block;
            padding: 12px 28px;
            background: #003366;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            margin-top: 24px;
            font-size: 15px;
            font-weight: 500;
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
        @media only screen and (max-width: 600px) {
            .content { padding: 20px; }
            .detail-label { width: 110px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://api.captoneproject101.online/api/logo"
                 alt="TMC Logo"
                 class="logo"
                 onerror="this.style.display='none'; document.getElementById('logo-fallback').style.display='block';">
            <div id="logo-fallback" style="display:none;">
                <h1 style="color:#fff; margin:0;">ProfScan</h1>
            </div>
            <h1>ProfScan Security Alert</h1>
            <p>Trinidad Municipal College</p>
        </div>

        <div class="content">
            <div class="alert-badge">
                <span>🔐 New Admin Login Detected</span>
            </div>

            <div class="greeting">Hello, {{ $name }}!</div>

            <div class="message">
                A new login to your <strong>ProfScan Admin Dashboard</strong> was detected.
                Here are the details:
            </div>

            <div class="details">
                <div class="detail-row">
                    <div class="detail-label">Administrator</div>
                    <div class="detail-value">{{ $name }} ({{ $email }})</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Login Time</div>
                    <div class="detail-value">{{ $time }}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">IP Address</div>
                    <div class="detail-value">{{ $ip }}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Device/Browser</div>
                    <div class="detail-value">{{ $userAgent }}</div>
                </div>
            </div>

            @if($ip !== '127.0.0.1' && $ip !== '::1')
            <div class="warning">
                <p>⚠️ This login was from an external IP address. If you did not initiate this login, please secure your account immediately and contact IT support.</p>
            </div>
            @endif

            <div style="text-align: center;">
                <a href="https://web.captoneproject101.online/admin/dashboard" class="button">
                    Go to Admin Dashboard
                </a>
            </div>
        </div>

        <div class="footer">
            <p>© {{ date('Y') }} ProfScan. All rights reserved.</p>
            <p>Trinidad Municipal College - Faculty Attendance System</p>
            <p>If you have any questions, please contact IT support.</p>
        </div>
    </div>
</body>
</html>