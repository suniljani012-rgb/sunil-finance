/**
 * Google Apps Script Web App for sending OTP Emails for Sunil Finance App.
 * How to Deploy:
 * 1. Go to script.google.com and log in with your Google account.
 * 2. Create a new project, delete the default function, and paste this code.
 * 3. Click "Deploy" -> "New deployment".
 * 4. Choose type "Web app".
 * 5. Set Description to "Sunil Finance Email API".
 * 6. Set "Execute as" to "Me (your email)".
 * 7. Set "Who has access" to "Anyone".
 * 8. Click "Deploy", authorize permissions, and copy the Web App URL.
 * 9. Paste this URL in your Cloudflare Pages environment variables or configuration.
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var email = data.email;
    var otp = data.otp;
    var username = data.username || "User";
    var type = data.type || "register"; // 'register' or 'login'
    
    if (!email || !otp) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: "Email and OTP are required"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var subject = "";
    var title = "";
    var messageText = "";

    if (type === "register") {
      subject = "Verify Your Account - Sunil Finance";
      title = "Welcome to Sunil Finance!";
      messageText = "Thank you for registering. Use the OTP below to verify your email and activate your account.";
    } else {
      subject = "Your Login OTP - Sunil Finance";
      title = "Secure Login Verification";
      messageText = "A login attempt was made for your account. Use the OTP below to complete your login.";
    }

    // HTML Email Template
    var htmlBody = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0b0f19; padding: 40px 20px; color: #f3f4f6; text-align: center;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);">
          
          <!-- Logo Header -->
          <div style="margin-bottom: 24px;">
            <h1 style="color: #10b981; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">
              Sunil <span style="color: #6366f1;">Finance</span>
            </h1>
            <p style="color: #9ca3af; font-size: 14px; margin-top: 4px; margin-bottom: 0;">Your Smart Wealth & Loan Manager</p>
          </div>

          <hr style="border: 0; border-top: 1px solid #1f2937; margin: 24px 0;">

          <!-- Content -->
          <h2 style="font-size: 20px; color: #ffffff; margin-top: 0; margin-bottom: 12px; font-weight: 600;">
            ${title}
          </h2>
          <p style="color: #9ca3af; font-size: 15px; line-height: 1.5; margin-bottom: 24px;">
            Hello ${username},<br>
            ${messageText}
          </p>

          <!-- OTP Code Box -->
          <div style="background: linear-gradient(135deg, #1f2937 0%, #111827 100%); border: 1px solid #374151; padding: 18px; border-radius: 12px; display: inline-block; margin-bottom: 24px; letter-spacing: 6px; font-weight: 800; font-size: 32px; color: #10b981; text-shadow: 0 0 10px rgba(16, 185, 129, 0.2);">
            ${otp}
          </div>

          <p style="color: #ef4444; font-size: 12px; margin-top: 0; margin-bottom: 8px;">
            This OTP is valid for 10 minutes.
          </p>
          <p style="color: #6b7280; font-size: 12px; margin-bottom: 0; line-height: 1.4;">
            If you did not request this email, please secure your account or contact support.
          </p>

          <hr style="border: 0; border-top: 1px solid #1f2937; margin: 24px 0;">

          <!-- Footer -->
          <div style="font-size: 11px; color: #4b5563;">
            &copy; ${new Date().getFullYear()} Sunil Finance. All rights reserved.
          </div>
        </div>
      </div>
    `;

    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: htmlBody,
      noReply: true
    });

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Email sent successfully"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
