const util = require("../../../exports/util");
const AdminUsersModel = require("../../../models/AdminUsers.model");
const PasswordSetUpTokenModel = require("../../../models/PasswordSetUpToken.model");
const mailer = require("../../../exports/mailer");
const bcrypt = require("bcryptjs");

const getAll = async (req, res) => {
  try {
    const users = await AdminUsersModel.find({ isDeleted: false })
      .select("-__v")
      .populate("role")
      .sort({ createdAt: -1 });
    util.ResSuss(req, res, users, "Get all users successfully.");
  } catch (error) {
    console.error("Users getAll error:", error);
    return util.ResFail(req, res, "An error occurred. Please try again.");
  }
};

const getOne = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await AdminUsersModel.findById(id)
      .populate("role")
      .select("-__v");
    util.ResSuss(req, res, user, "Get a user successfully.");
  } catch (error) {
    console.error("Users getOne error:", error);
    return util.ResFail(req, res, "An error occurred. Please try again.");
  }
};

const setUpPassword = async (req, res) => {
  try {
    const { email, password, token } = req.body;

    const adminUser = await AdminUsersModel.findOne({ email: email }).catch(
      (error) => {
        throw error;
      }
    );

    if (!util.notEmpty(adminUser)) {
      return util.ResFail(req, res, "User not found.");
    }

    const hashedToken = util.hashToken(token);
    const tokenSetUpPassword = await PasswordSetUpTokenModel.findOne({
      hashedToken,
      expiresAt: { $gt: new Date() },
    });

    if (util.isEmpty(tokenSetUpPassword)) {
      return util.ResFail(req, res, "Invalid token or token expired.");
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = await AdminUsersModel.findOneAndUpdate(
      { email },
      {
        password: hashedPassword,
        passwordChangedAt: new Date(),
      },
      { new: true }
    );

    if (util.notEmpty(user)) {
      // ADD: Create default data for the user
      await PasswordSetUpTokenModel.deleteMany({ adminUserId: user._id });

      return util.ResSuss(
        req,
        res,
        null,
        "Account set up password successfully!"
      );
    }

    return util.ResFail(
      req,
      res,
      "Failed to set up password as our user. Please try it again later!"
    );
  } catch (error) {
    console.error("set up password error:", error);
    return util.ResFail(
      req,
      res,
      "An error occurred during registration. Please try again."
    );
  }
};

const requestLinkSetUpPassword = async (req, res) => {
  try {
    const { email } = req.query;

    const user = await AdminUsersModel.findOne({ email });

    if (util.isEmpty(user)) {
      return util.ResFail(req, res, "User not found.");
    }

    const existingToken = await PasswordSetUpTokenModel.findOne({
      adminUserId: user._id,
    });

    if (existingToken && Date.now() - existingToken.createdAt < 60000) {
      return util.ResFail(
        req,
        res,
        "Please wait 60 seconds before requesting another set up password."
      );
    }
    await PasswordSetUpTokenModel.deleteMany({
      adminUserId: user._id,
    });

    const setUpToken = util.generateResetToken();
    const hashedToken = util.hashToken(setUpToken);

    await PasswordSetUpTokenModel.create({
      adminUserId: user._id,
      token: setUpToken.substring(0, 8),
      hashedToken: hashedToken,
      createdAt: Date.now(),
    });

    // Create reset URL
    const resetUrl = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/auth/set-up-password?token=${setUpToken}&email=${user.email}`;

    // Send email
    const transporter = mailer.createEmailTransporter();
    const emailTemplate = mailer.getPasswordSetUpEmailTemplate(
      resetUrl,
      user.email,
      24
    );

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    return util.ResSuss(
      req,
      res,
      null,
      "Set up password request link successfully. Please check your email."
    );
  } catch (error) {
    console.log(error);

    return util.ResFail(
      req,
      res,
      "An error occurred during request. Please try again."
    );
  }
};

const deleteUser = async (req, res) => {
    const {id} = req.params;
  try {

    const user = await AdminUsersModel.findOne({_id: id, isSuperAdmin: false});


    if(util.isEmpty(user)){
        return util.ResFail(req, res, "User not found.")
    }

    if(user.isSuperAdmin){
        return util.ResFail(req, res, "Super Admin Account can't be deleted.")
    }

    user.isDeleted = true;

    await user.save()
    
    return util.ResSuss(req, res, null, "Deleted User Successfully.");
  } catch (error) {
    console.log(error);

    return util.ResFail(
      req,
      res,
      "An error occurred during delete. Please try again."
    );
  }
};

module.exports = { getAll, setUpPassword, requestLinkSetUpPassword, getOne, deleteUser };
