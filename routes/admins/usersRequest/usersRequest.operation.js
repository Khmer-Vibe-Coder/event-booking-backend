const AppUsersModel = require("../../../models/AppUsers.model");
const util = require("../../../exports/util");
const PasswordResetTokenModel = require("../../../models/PasswordResetToken.model");
const PasswordSetUpTokenModel = require("../../../models/PasswordSetUpToken.model");
const mailer = require("../../../exports/mailer");
const AdminUsersModel = require("../../../models/AdminUsers.model");
const AdminUsersRequestModel = require("../../../models/AdminUsersRequest.model");
const RoleModel = require("../../../models/Role.model");

const register = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, terms, consents } = req.body;

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

    const existingRequest = await AdminUsersRequestModel.findOne({
      email: normalizedEmail,
    });

    // get email system admin
    const adminAccount = await AdminUsersModel.findOne({ isSuperAdmin: true });

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

        // Update the rejected record to pending again
        existingRequest.firstName = firstName;
        existingRequest.lastName = lastName;
        existingRequest.username = `${firstName} ${lastName}`;
        existingRequest.status = "pending";
        existingRequest.rejectReason = null;
        existingRequest.actionBy = null
        existingRequest.phone = phone
        const resubmitUser = await existingRequest.save();

        // Optionally: notify admin again here

        const transporter = mailer.createEmailTransporter();
        const emailTemplate = mailer.getUserRegistrationNotificationTemplate(
          resubmitUser,
          true
        );

        // send email to system admin
        await transporter.sendMail({
          from:process.env.EMAIL_USER,
          to: process.env.EMAIL_USER,
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
    const user = await AdminUsersRequestModel.create({
      firstName,
      lastName,
      username: `${firstName} ${lastName}`,
      email: normalizedEmail,
      status: "pending",
      phone: phone
    });

    // Optionally: notify admin here

    const transporter = mailer.createEmailTransporter();
    const emailTemplate = mailer.getUserRegistrationNotificationTemplate(
      user,
      false
    );

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
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

const users = await AdminUsersRequestModel.find(query)
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

    const existingUser = await AdminUsersRequestModel.findOneAndUpdate({_id: id, status: {$ne: "rejected"}}, {
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
      from: process.env.EMAIL_USER,
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
  const {roleId} = req.body

  try {
    const existingUser = await AdminUsersRequestModel.findOne({_id: id, status: {$nin: ["rejected", "approved"]}});

    if (util.isEmpty(existingUser)) {
      return util.ResFail(req, res, "User request not found or user request has already been approved or rejected.", 400);
    }

    const role = await RoleModel.findById(roleId);

    if(util.isEmpty(role)){
      return util.ResFail(req, res, "Invalid role.");
    }

    existingUser.status = "approved";
    existingUser.actionBy = util.objectId(_id);
    existingUser.rejectReason = null;

    await existingUser.save();

    const newAdminUser = await AdminUsersModel.create({
      firstName: existingUser.firstName,
      lastName: existingUser.lastName,
      username: existingUser.username,
      password: util.generateResetToken(), // set default password for first try (user change later)
      email: existingUser.email,
      phone: existingUser.phone,
      role: util.objectId(role._id)
    })

    const setUpToken = util.generateResetToken();
    const hashedToken = util.hashToken(setUpToken);

    await PasswordSetUpTokenModel.deleteMany({
      adminUserId: newAdminUser._id,
    });

    await PasswordSetUpTokenModel.create({
      adminUserId: newAdminUser._id,
      token: setUpToken.substring(0, 8),
      hashedToken: hashedToken,
    });

    // Create setup URL
    const setUpUrl = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/auth/set-up-password?token=${setUpToken}&email=${newAdminUser.email}`;

    // Send email
    const transporter = mailer.createEmailTransporter();
    const emailTemplate = mailer.getPasswordSetUpEmailTemplate(
      setUpUrl,
      existingUser.email,
      24
    );

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: newAdminUser.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    return util.ResSuss(
      req,
      res,
      newAdminUser,
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
