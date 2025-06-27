const AppUsersModel = require("../../../models/AppUsers.model");
const util = require("../../../exports/util");
const AppUsersRequestModel = require("../../../models/AppUsersRequest.model");
const PasswordResetTokenModel = require("../../../models/PasswordResetToken.model");
const PasswordSetUpTokenModel = require("../../../models/PasswordSetUpToken.model");
const mailer = require("../../../exports/mailer");
const AdminUsersModel = require("../../../models/AdminUsers.model");

const register = async (req, res) => {
  try {
    const { firstName, lastName, email, terms, consents } = req.body;

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

    const normalizedEmail = email.toLowerCase().trim();
    const existingRequest = await AppUsersRequestModel.findOne({
      email: normalizedEmail,
    });

    // get email system admin
    const adminAccount = await AdminUsersModel.findOne({ isSystemAdmin: true });

    // Check if already exists
    if (existingRequest) {
      if (existingRequest.status === "pending") {
        return util.ResFail(
          req,
          res,
          "Your request is already pending admin approval."
        );
      }

      if (existingRequest.status === "approved") {
        return util.ResFail(
          req,
          res,
          "Your request was already approved. You may log in or set up your password."
        );
      }

      if (existingRequest.status === "rejected") {
        // Allow re-request only after 24h
        // const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        // if (existingRequest.updatedAt > oneDayAgo) {
        //   return util.ResFail(req, res, "You can re-submit your request 24 hours after the last rejection.");
        // }

        // Update the rejected record to pending again
        existingRequest.firstName = firstName;
        existingRequest.lastName = lastName;
        existingRequest.username = `${firstName} ${lastName}`;
        existingRequest.status = "pending";
        existingRequest.rejectReason = null;
        existingRequest.retries = (existingRequest.retries || 0) + 1;
        existingRequest.lastSubmittedAt = new Date();
        const resubmitUser = await existingRequest.save();

        // Optionally: notify admin again here

        const transporter = mailer.createEmailTransporter();
        const emailTemplate = mailer.getUserRegistrationNotificationTemplate(
          resubmitUser,
          true
        );

        // send email to system admin
        await transporter.sendMail({
          from: `"Your Expense Tracker" <${process.env.EMAIL_USER}>`,
          to: adminAccount?.email || "Admin",
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text,
        });

        return util.ResSuss(
          req,
          res,
          existingRequest,
          "Your request has been re-submitted. Please wait for admin confirmation."
        );
      }
    }

    // Create a new request
    const user = await AppUsersRequestModel.create({
      firstName,
      lastName,
      username: `${firstName} ${lastName}`,
      email: normalizedEmail,
      status: "pending",
      lastSubmittedAt: new Date(),
    });

    // Optionally: notify admin here

    const transporter = mailer.createEmailTransporter();
    const emailTemplate = mailer.getUserRegistrationNotificationTemplate(
      user,
      false
    );

    await transporter.sendMail({
      from: `"Your Expense Tracker" <${process.env.EMAIL_USER}>`,
      to: adminAccount?.email || "Admin",
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    return util.ResSuss(
      req,
      res,
      user,
      "Register successfully. Please wait for confirmation by admin."
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

const getUsersRequest = async (req, res) => {
  const { status = "", search = "" } = req.query;

  const statusFormat = ["pending", "approved", "rejected"];
  try {
    const query = {};

    if (status && statusFormat.includes(status)) {
      query.status = status;
    }

    if (search) {
      query.email = { $regex: search, $options: "i" };
      query.username = { $regex: search, $options: "i" };
    }

const users = await AppUsersRequestModel.find(query)
  .populate({
    path: "actionBy",
    select: "-password -createdAt -updatedAt -__v" 
  });


    return util.ResSuss(req, res, users, "Get all users request.");
  } catch (error) {
    console.error("getUserRequest error:", error);
    return util.ResFail(
      req,
      res,
      "Internal server error. Please try again later."
    );
  }
};

const rejectUserRequest = async (req, res) => {
  const { _id } = req.user;
  const { id } = req.params;
  const { rejectReason = "" } = req.body;

  try {
    if (!util.notEmpty(rejectReason)) {
      return util.ResFail(req, res, "Reject reason is required.");
    }

    const existingUser = await AppUsersRequestModel.findOneAndUpdate({_id: id, status: {$ne: "rejected"}}, {
      rejectReason,
      actionBy: util.objectId(_id),
      status: "rejected",
    });

    if (util.isEmpty(existingUser)) {
      return util.ResFail(req, res, "User request not found or user request is already rejected.", 400);
    }
    // Send email
    const transporter = mailer.createEmailTransporter();
    const emailTemplate = mailer.getUserRejectionEmailTemplate(
      existingUser,
      rejectReason
    );

    await transporter.sendMail({
      from: `"Your Expense Tracker" <${process.env.EMAIL_USER}>`,
      to: existingUser.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    return util.ResSuss(req, res, existingUser, "Reject user request successfully.");
  } catch (error) {
    console.error("Reject error:", error);
    return util.ResFail(
      req,
      res,
      "Internal server error. Please try again later."
    );
  }
};

const approveUserRequest = async (req, res) => {
  const { _id } = req.user;
  const { id } = req.params;

  try {
    const existingUser = await AppUsersRequestModel.findOne({_id: id, status: {$nin: ["rejected", "approved"]}});

    if (util.isEmpty(existingUser)) {
      return util.ResFail(req, res, "User request not found or user request has already been approved or rejected.", 400);
    }

    existingUser.status = "approved";
    existingUser.actionBy = util.objectId(_id);
    existingUser.rejectReason = null;

    await existingUser.save();

    // add to appUser
    const appUser = await AppUsersModel.create({
      email: existingUser.email,
      firstName: existingUser.firstName,
      lastName: existingUser.lastName,
      username: existingUser.username,
    });

    const resetToken = util.generateResetToken();
    const hashedToken = util.hashToken(resetToken);

    await PasswordSetUpTokenModel.deleteMany({
      appUserId: appUser._id,
    });

    await PasswordSetUpTokenModel.create({
      appUserId: appUser._id,
      token: resetToken.substring(0, 8),
      hashedToken: hashedToken,
    });

    // Create reset URL
    const resetUrl = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/auth/set-up-password?token=${resetToken}&email=${appUser.email}`;

    // Send email
    const transporter = mailer.createEmailTransporter();
    const emailTemplate = mailer.getPasswordSetUpEmailTemplate(
      resetUrl,
      appUser.email,
      24
    );

    await transporter.sendMail({
      from: `"Your Expense Tracker" <${process.env.EMAIL_USER}>`,
      to: appUser.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    return util.ResSuss(
      req,
      res,
      appUser,
      "Approved user successfully. Link set up password has sent to user."
    );
  } catch (error) {
    console.error("approve user error:", error);
    return util.ResFail(
      req,
      res,
      "Internal server error. Please try again later."
    );
  }
};

module.exports = {
  getUsersRequest,
  approveUserRequest,
  register,
  rejectUserRequest,
};
