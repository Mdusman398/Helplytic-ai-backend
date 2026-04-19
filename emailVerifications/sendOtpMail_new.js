import nodemailer from "nodemailer"
import "dotenv/config"

export const sendOtpMail = async(email, otp) => {
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f9f9f9;
                border-radius: 8px;
            }
            .header {
                text-align: center;
                padding: 20px 0;
                border-bottom: 2px solid #ff6b6b;
                margin-bottom: 20px;
            }
            .header h1 {
                color: #ff6b6b;
                margin: 0;
            }
            .content {
                padding: 20px 0;
            }
            .otp-box {
                background-color: #e8f4f8;
                border: 2px solid #007bff;
                padding: 20px;
                text-align: center;
                border-radius: 8px;
                margin: 20px 0;
            }
            .otp-code {
                font-size: 32px;
                font-weight: bold;
                color: #007bff;
                letter-spacing: 5px;
                font-family: 'Courier New', monospace;
            }
            .otp-expiry {
                color: #ff6b6b;
                font-weight: bold;
                margin-top: 10px;
            }
            .warning {
                background-color: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 15px;
                margin: 20px 0;
                border-radius: 3px;
            }
            .footer {
                text-align: center;
                padding: 20px 0;
                border-top: 1px solid #ddd;
                margin-top: 20px;
                font-size: 12px;
                color: #999;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Password Reset OTP</h1>
                <p>Helplytics AI</p>
            </div>
            
            <div class="content">
                <p>Hello,</p>
                <p>We received a request to reset your password. Use the OTP (One-Time Password) below to complete the password reset process:</p>
                
                <div class="otp-box">
                    <div class="otp-code">${otp}</div>
                    <div class="otp-expiry">Valid for 10 minutes</div>
                </div>
                
                <div class="warning">
                    <strong>⚠️ Important Security Notice:</strong>
                    <ul>
                        <li><strong>Never share this OTP</strong> with anyone, including Helplytics AI support staff</li>
                        <li>This OTP will expire in <strong>10 minutes</strong></li>
                        <li>If you did not request a password reset, ignore this email</li>
                        <li>Your account is only at risk if someone has access to this OTP</li>
                    </ul>
                </div>
                
                <p>If you did not request a password reset, please ignore this email and secure your account by changing your password immediately.</p>
                
                <p>Need help? Contact our support team at support@helplytics.ai</p>
                
                <p>Best regards,<br>The Helplytics AI Team</p>
            </div>
            
            <div class="footer">
                <p>&copy; 2024 Helplytics AI. All rights reserved.</p>
                <p>This is an automated message, please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
    `

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS
        }
    })

    const mailOptions = {
        from: process.env.MAIL_USER,
        to: email,
        subject: "Your Password Reset OTP - Helplytics AI",
        html: htmlContent,
    }

    await transporter.sendMail(mailOptions)
    console.log("OTP email sent successfully to " + email)
}
