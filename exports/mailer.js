// ====================
// EMAIL SERVICE CONFIGURATION
// ====================

const nodemailer = require("nodemailer");

// Configure email transporter (using Gmail as example)
const createEmailTransporter = () => {
  return nodemailer.createTransport({
     service: 'gmail', // or your email provider
    // host: process.env.EMAIL_HOST,
    // port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER, // your email
      pass: process.env.EMAIL_APP_PASSWORD, // app-specific password
    },
    // Alternative SMTP configuration:
    // host: 'smtp.gmail.com',
    // port: 587,
    // secure: false,
    // auth: {
    //   user: process.env.EMAIL_USER,
    //   pass: process.env.EMAIL_APP_PASSWORD
    // }
  });
};

// ====================
// EMAIL TEMPLATES
// ====================

const getPasswordResetEmailTemplate = (resetUrl, userEmail, expirationTime) => {
  return {
    subject: "Password Reset Request - Your Blog Platform",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8f9fa;
            margin: 0;
            padding: 20px;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .email-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .email-header h1 {
            margin: 0;
            font-size: 28px;
          }
          .email-content {
            padding: 40px 30px;
          }
          .reset-button {
            display: inline-block;
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white !important;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            transition: transform 0.2s ease;
          }
          .reset-button:hover {
            transform: translateY(-2px);
          }
          .security-info {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin: 25px 0;
            border-radius: 4px;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            font-size: 14px;
            color: #666;
          }
          .divider {
            height: 1px;
            background: #e9ecef;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <h1>🔒 Password Reset</h1>
          </div>
          
          <div class="email-content">
            <h2>Hello!</h2>
            <p>We received a request to reset the password for your account associated with <strong>${userEmail}</strong>.</p>
            
            <p>If you requested this password reset, click the button below to set a new password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a target="_blank" rel="noopener noreferrer" href="${resetUrl}" class="reset-button">Reset My Password</a>
            </div>
            
            <div class="security-info">
              <h3 style="margin-top: 0; color: #495057;">🛡️ Security Information</h3>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>This link will expire in <strong>${expirationTime} minutes</strong></li>
                <li>If you didn't request this reset, you can safely ignore this email</li>
                <li>Your password won't change until you click the link above</li>
              </ul>
            </div>
            
            <div class="divider"></div>
            
            <p><strong>Alternative link:</strong></p>
            <p style="word-break: break-all; font-size: 14px; color: #666;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a target="_blank" rel="noopener noreferrer" href="${resetUrl}" style="color: #667eea;">${resetUrl}</a>
            </p>
          </div>
          
          <div class="footer">
            <p>This is an automated message from Your Blog Platform.</p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Password Reset Request
      
      Hello!
      
      We received a request to reset the password for your account (${userEmail}).
      
      If you requested this password reset, click the link below to set a new password:
      ${resetUrl}
      
      This link will expire in ${expirationTime} minutes.
      
      If you didn't request this reset, you can safely ignore this email.
      Your password won't change until you click the link above.
      
      ---
      This is an automated message from Your Blog Platform.
    `,
  };
};

const getPasswordSetUpEmailTemplate = (
  setupUrl,
  userEmail,
  expirationTimeInHours
) => {
  return {
    subject: "Set Up Your Password - Your Blog Platform",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Setup</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8f9fa;
            margin: 0;
            padding: 20px;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .email-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .email-header h1 {
            margin: 0;
            font-size: 28px;
          }
          .email-content {
            padding: 40px 30px;
          }
          .setup-button {
            display: inline-block;
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white !important;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            transition: transform 0.2s ease;
          }
          .setup-button:hover {
            transform: translateY(-2px);
          }
          .security-info {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin: 25px 0;
            border-radius: 4px;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            font-size: 14px;
            color: #666;
          }
          .divider {
            height: 1px;
            background: #e9ecef;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <h1>🔐 Set Up Your Password</h1>
          </div>
          
          <div class="email-content">
            <h2>Welcome!</h2>
            <p>Your account associated with <strong>${userEmail}</strong> has been approved.</p>
            
            <p>To activate your account, please click the button below to set up your password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a target="_blank" rel="noopener noreferrer" href="${setupUrl}" class="setup-button">Set My Password</a>
            </div>
            
            <div class="security-info">
              <h3 style="margin-top: 0; color: #495057;">🛡️ Security Information</h3>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>This link will expire in <strong>${expirationTimeInHours} hours</strong></li>
                <li>If you didn't request this, you can safely ignore this email</li>
                <li>Your account won't be activated until you set your password</li>
              </ul>
            </div>
            
            <div class="divider"></div>
            
            <p><strong>Alternative link:</strong></p>
            <p style="word-break: break-all; font-size: 14px; color: #666;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a target="_blank" rel="noopener noreferrer" href="${setupUrl}" style="color: #667eea;">${setupUrl}</a>
            </p>
          </div>
          
          <div class="footer">
            <p>This is an automated message from Your Blog Platform.</p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Password Setup

      Welcome!

      Your account (${userEmail}) has been approved.

      To activate your account, click the link below to set your password:
      ${setupUrl}

      This link will expire in ${expirationTimeInHours} hours.

      If you didn't request this, you can safely ignore this email.
      Your account won't be active until you set your password.

      ---
      This is an automated message from Your Blog Platform.
    `,
  };
};

const getUserRegistrationNotificationTemplate = (
  user,
  isResubmission = false
) => {
  return {
    subject: isResubmission
      ? `User Re-Submitted Access Request: ${user.email}`
      : `New User Access Request: ${user.email}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>User Registration Notification</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8f9fa;
            margin: 0;
            padding: 20px;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .email-header {
            background: linear-gradient(135deg, #00b894, #0984e3);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .email-header h1 {
            margin: 0;
            font-size: 26px;
          }
          .email-content {
            padding: 40px 30px;
          }
          .info-row {
            margin-bottom: 12px;
          }
          .info-row strong {
            width: 130px;
            display: inline-block;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            font-size: 14px;
            color: #666;
          }
          .divider {
            height: 1px;
            background: #e9ecef;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <h1>${
              isResubmission
                ? "🔁 Re-Submitted Request"
                : "🆕 New Registration Request"
            }</h1>
          </div>
          <div class="email-content">
            <p>A user has ${
              isResubmission ? "re-submitted" : "submitted"
            } a registration request. Below are the details:</p>
            <div class="info-row"><strong>Full Name:</strong> ${
              user.firstName
            } ${user.lastName}</div>
            <div class="info-row"><strong>Email:</strong> ${user.email}</div>
            <div class="info-row"><strong>Status:</strong> ${
              isResubmission ? "Re-submission" : "New request"
            }</div>
            ${
              user.retries !== undefined
                ? `<div class="info-row"><strong>Retry Count:</strong> ${user.retries}</div>`
                : ""
            }
            <div class="divider"></div>
            <p>Please log in to the admin dashboard to review and take action.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from your Event Booking Platform.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      ${
        isResubmission
          ? "Re-Submitted User Request"
          : "New User Registration Request"
      }

      Full Name: ${user.firstName} ${user.lastName}
      Email: ${user.email}
      Status: ${isResubmission ? "Re-submission" : "New"}
      ${user.retries !== undefined ? `Retry Count: ${user.retries}` : ""}

      ---
      This is an automated message from your Event Booking Platform.
      Please log in to the admin dashboard to take action.
    `,
  };
};
const getUserRejectionEmailTemplate = (user, reason = null) => {
  return {
    subject: "Your Access Request Has Been Rejected",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Request Rejected</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8f9fa;
            margin: 0;
            padding: 20px;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .email-header {
            background: linear-gradient(135deg, #ff6b6b, #ee5253);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .email-header h1 {
            margin: 0;
            font-size: 26px;
          }
          .email-content {
            padding: 40px 30px;
          }
          .reason-box {
            background: #fff3f3;
            border-left: 4px solid #ee5253;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            font-size: 14px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <h1>❌ Access Request Rejected</h1>
          </div>
          <div class="email-content">
            <p>Hello <strong>${user.firstName} ${user.lastName}</strong>,</p>
            <p>We regret to inform you that your request to join our platform has been rejected.</p>
            ${
              reason
                ? `<div class="reason-box">
                    <strong>Reason:</strong><br>${reason}
                  </div>`
                : ""
            }
            <p>If you believe this was a mistake or would like to update your information, feel free to resubmit your request.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from Your Event Booking Platform.</p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Access Request Rejected

      Hello ${user.firstName} ${user.lastName},

      We regret to inform you that your request to join our platform has been rejected.
      ${reason ? `Reason: ${reason}` : ""}

      If you believe this was a mistake or would like to update your information, feel free to resubmit your request.

      ---
      This is an automated message from Your Event Booking Platform.
    `,
  };
};

module.exports = {
  createEmailTransporter,
  getPasswordResetEmailTemplate,
  getPasswordSetUpEmailTemplate,
  getUserRegistrationNotificationTemplate,
  getUserRejectionEmailTemplate,
};
