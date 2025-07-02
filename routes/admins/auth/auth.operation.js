const util = require("../../../exports/util");
const AdminUser = require("../../../models/AdminUsers.model");
const PasswordResetToken = require("../../../models/PasswordResetToken.model");
const bcrypt = require("bcryptjs");
const mailer = require("../../../exports/mailer");
const jwt = require("jsonwebtoken");
const AdminUsersModel = require("../../../models/AdminUsers.model");

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await AdminUser.findOne({ email: email , isDeleted: false});
    if (!user) {
      // User not found
      return util.ResFail(req, res, "User not found. Please check your email.");
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      // Wrong password
      return util.ResFail(req, res, "Incorrect password. Please try again.");
    }

    if (util.notEmpty(user)) {
      // Generate JWT
      const token = jwt.sign(
        { id: String(user._id), email: user.email },
        process.env.JWT_SECRET, // secret key in env vars
        { expiresIn: "1h" } // token expiry time
      );

      return util.ResSuss(
        req,
        res,
        { token: `Bearer ${token}` },
        "Login Successfully!"
      );
    }

    return util.ResFail(req, res, "Invaild User!");
  } catch (error) {
    console.error("Login route error:", error);
    return util.ResFail(
      req,
      res,
      "An error occurred during login. Please try again."
    );
  }
};

const register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      terms,
      consents,
      isSuperAdmin = false,
    } = req.body;

    const checkIfEmailExist = await AdminUser.findOne({ email: email }).catch(
      (error) => {
        throw error;
      }
    );
    if (util.notEmpty(checkIfEmailExist)) {
      return util.ResFail(req, res, "Email already exists.");
    }
    if (isSuperAdmin == true) {
      const existingSuperAdmin = await AdminUsersModel.findOne({
        isSuperAdmin,
      });
      if (util.notEmpty(existingSuperAdmin)) {
        return util.ResFail(req, res, "Super admin account is already exist!");
      }
    }
    if (!util.validateEmail(email)) {
      return util.ResFail(req, res, "Invalid email format!");
    }

    if (!terms || !consents) {
      return util.ResFail(
        req,
        res,
        "You must agree to our terms and conditions!"
      );
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = await AdminUser({
      username: firstName + " " + lastName,
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: hashedPassword,
      isSuperAdmin
    }).save();

    if (util.notEmpty(user)) {
      // ADD: Create default data for the user
      return util.ResSuss(req, res, null, "Account created successfully!");
    }

    return util.ResFail(
      req,
      res,
      "Failed to register as our user. Please try it again later!"
    );
  } catch (error) {
    console.error("Register route error:", error);
    return util.ResFail(
      req,
      res,
      "An error occurred during registration. Please try again."
    );
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;

    // Validate input
    if (!token || !email || !newPassword) {
      return util.ResFail(req, res, "All fields are required!");
    }

    if (!util.validateEmail(email)) {
      return util.ResFail(req, res, "Invalid email format!");
    }

    const normalizedEmail = email.toLowerCase().trim();
    const hashedToken = util.hashToken(token);

    // Find and validate token
    const tokenRecord = await PasswordResetToken.findOne({
      email: normalizedEmail,
      hashedToken,
      expiresAt: { $gt: new Date() },
      used: false,
    });

    if (!tokenRecord) {
      return util.ResFail(req, res, "Invalid or expired reset token!");
    }

    // Find user
    const user = await AdminUser.findById(tokenRecord.adminUserId);
    if (!user) {
      return util.ResFail(req, res, "User not found!");
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password
    await AdminUser.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      passwordChangedAt: new Date(),
    });

    // Delete all other reset tokens for this user
    await PasswordResetToken.deleteMany({
      adminUserId: user._id,
      _id: { $ne: tokenRecord._id },
    });

    console.log(`Password reset successful for user: ${normalizedEmail}`);

    return util.ResSuss(
      req,
      res,
      null,
      "Password has been reset successfully."
    );
    
  } catch (error) {
    console.error("Reset password error:", error);
    return util.ResFail(
      req,
      res,
      "Internal server error. Please try again later."
    );
  }
};

const verifyResetToken = async (req, res) => {
  try {
    const { token, email } = req.query;

    // Validate input
    if (!token || !email) {
      return util.ResFail(req, res, "Token and email are required.");
    }

    if (!util.validateEmail(email)) {
      return util.ResFail(req, res, "Invalid email format.");
    }

    const normalizedEmail = email.toLowerCase().trim();
    const hashedToken = util.hashToken(token);

    // Find valid token
    const tokenRecord = await PasswordResetToken.findOne({
      email: normalizedEmail,
      hashedToken,
      expiresAt: { $gt: new Date() },
      used: false,
    }).populate("adminUserId", "email name");

    if (!tokenRecord) {
      return util.ResFail(req, res, "Invalid or expired reset token.");
    }

    return util.ResSuss(req, res, null, "Token is valid.");
  } catch (error) {
    console.error("Verify reset token error:", error);
    return util.ResFail(req, res, "Internal server error.");
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email, resend = false } = req.body;

    // Validate input
    if (!email) {
      return util.ResFail(req, res, "Email address is required.");
    }

    if (!util.validateEmail(email)) {
      return util.ResFail(req, res, "Please provide a valid email address.");
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email (adjust based on your User model)
    const user = await AdminUser.findOne({ email: normalizedEmail });

    // Always return success for security (don't reveal if email exists)
    if (!user) {
      return util.ResFail(
        req,
        res,
        "If an account with that email exists, we have sent a password reset link."
      );
    }

    // Check for existing unexpired token
    const existingToken = await PasswordResetToken.findOne({
      adminUserId: user._id,
      expiresAt: { $gt: new Date() },
      used: false,
    });

    // If resending and recent token exists, use it
    if (
      resend &&
      existingToken &&
      Date.now() - existingToken.createdAt < 60000
    ) {
      return util.ResFail(
        req,
        res,
        "Please wait 60 seconds before requesting another reset email."
      );
    }

    // Generate new reset token
    const resetToken = util.generateResetToken();
    const hashedToken = util.hashToken(resetToken);

    // Delete any existing tokens for this user
    await PasswordResetToken.deleteMany({ adminUserId: user._id });

    // Create new reset token record
    const tokenRecord = new PasswordResetToken({
      adminUserId: user._id,
      email: normalizedEmail,
      token: resetToken.substring(0, 8), // Store partial token for reference
      hashedToken,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    });

    await tokenRecord.save();

    // Create reset URL
    const resetUrl = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/auth/reset-password?token=${resetToken}&email=${normalizedEmail}`;

    // Send email
    const transporter = mailer.createEmailTransporter();
    const emailTemplate = mailer.getPasswordResetEmailTemplate(
      resetUrl,
      normalizedEmail,
      15
    );

    await transporter.sendMail({
      from: `"Your Expense Tracker" <${process.env.EMAIL_USER}>`,
      to: normalizedEmail,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    console.log(`Password reset email sent to: ${normalizedEmail}`);

    return util.ResSuss(
      req,
      res,
      null,
      "Password reset link has been sent to your email address."
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return util.ResFail(
      req,
      res,
      "Internal server error. Please try again later."
    );
  }
};

const getMe = async (req, res)=>{

    const { _id } = req.user;
  
    try {
      const user = await AdminUsersModel.findById(_id)
        .populate({
          path: "role",
          populate: {
            path: "rights",
            select: "-__v -updatedAt -createdAt",
          },
        })
        .select("-__v -password");
  
      util.ResSuss(req, res, user, "Get me successfully.");
    } catch (error) {
      console.error("Get me error:", error);
      return util.ResFail(req, res, "An error occurred. Please try again.");
    }
  
}

module.exports = {
  login,
  register,
  resetPassword,
  verifyResetToken,
  forgotPassword,
  getMe
};
