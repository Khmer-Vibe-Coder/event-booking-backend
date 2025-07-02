const util = require("../../../exports/util");
const AdminUsersModel = require("../../../models/AdminUsers.model");
const PasswordSetUpTokenModel = require("../../../models/PasswordSetUpToken.model");
const mailer = require("../../../exports/mailer");
const bcrypt = require("bcryptjs");
const OrganizationModel = require("../../../models/Organization.model");
const RoleModel = require("../../../models/Role.model");

const create = async (req, res) => {

  const { firstName, lastName, email, roleId } = req.body;
  const orgId = req.user.organization?._id  || null;

  try {
    // check duplicate user
    const existingUser = await AdminUsersModel.findOne({ email });
    if (util.notEmpty(existingUser)) {
      return util.ResFail(req, res, "Email is already exist.");
    }

    // check role
    const existingRole = await RoleModel.findById(roleId);

    if (util.isEmpty(existingRole)) {
      return util.ResFail(req, res, "Role not found.");
    }

    let organization;

    // check org
    if (util.notEmpty(orgId)) {
      organization = await OrganizationModel.findById(orgId);
      if (util.isEmpty(organization)) {
        return util.ResFail(req, res, "Organization not found.");
      }
    }

    const newAdminUser = await AdminUsersModel.create({
      firstName,
      lastName,
      username: firstName + " " + lastName,
      email,
      role: existingRole._id,
      organization: organization?._id || null,
    });

    const setUpToken = util.generateResetToken();
    const hashedToken = util.hashToken(setUpToken);

    await PasswordSetUpTokenModel.create({
      adminUserId: newAdminUser._id,
      token: setUpToken.substring(0, 8),
      hashedToken: hashedToken,
    });

    // Create setup URL
    const setUpUrl = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/auth/set-up-org-user-password?token=${setUpToken}&email=${
      newAdminUser.email
    }`;

    // Send email
    const transporter = mailer.createEmailTransporter();
    const emailTemplate = mailer.getPasswordSetUpEmailTemplate(
      setUpUrl,
      newAdminUser.email,
      24
    );

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: newAdminUser.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    util.ResSuss(req, res, newAdminUser, "Create a user successfully.");
  } catch (error) {
    console.error("Users getOne error:", error);
    return util.ResFail(req, res, "An error occurred. Please try again.");
  }
};

const getAll = async (req, res) => {
  const {
    page,
    per_page,
    search = "",
    start_created_at,
    end_created_at,
    is_organization_super_admin,
  } = req.query;

  const orgId = req.user.organization?._id || null
  // console.log(orgId);

  

  try {
    const pageNo = util.defaultPageNo(page);
    const pageSize = util.defaultPageSize(per_page);
    const skip = (pageNo - 1) * pageSize;

    const query = { isDeleted: false };
    if(orgId){
      query.$or = [{organization: orgId}, {isOrganizationSuperAdmin: true}]
    }

    // Filter Organization Super Admin
    if (util.notEmpty(is_organization_super_admin)) {
      query.isOrganizationSuperAdmin = is_organization_super_admin == "true";
    }

    // Search
    if (util.notEmpty(search)) {
      const regex = { $regex: search, $options: "i" };
      query.$or = [
        { username: regex },
        { email: regex },
        { firstName: regex },
        { lastName: regex },
      ];
    }

    if (util.notEmpty(start_created_at) || util.notEmpty(end_created_at)) {
      query.createdAt = {};
      if (start_created_at) query.createdAt.$gte = new Date(start_created_at);
      if (end_created_at) query.createdAt.$lte = new Date(end_created_at);
    }

    const users = await AdminUsersModel.find(query)
      .select("-__v -password")
      .populate("role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    const total = await AdminUsersModel.countDocuments(query);

    const paginate = util.getPagination(
      pageNo,
      pageSize,
      total,
      Math.ceil(total / pageSize)
    );

    return util.ResSuss(
      req,
      res,
      users,
      "Get all users successfully.",
      paginate
    );
  } catch (error) {
    console.error("Users getAll error:", error);
    return util.ResFail(req, res, "An error occurred. Please try again.");
  }
};

const getOne = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await AdminUsersModel.findById(id)
      .populate({
        path: "role",
        populate: {
          path: "rights",
          select: "-__v -updatedAt -createdAt",
        },
      })
      .select("-__v -password");

    util.ResSuss(req, res, user, "Get a user successfully.");
  } catch (error) {
    console.error("Users getOne error:", error);
    return util.ResFail(req, res, "An error occurred. Please try again.");
  }
};

const setUpPassword = async (req, res) => {
  try {
    const { email, password, token, orgId } = req.body;

    const adminUser = await AdminUsersModel.findOne({ email: email }).catch(
      (error) => {
        throw error;
      }
    );

    const org = await OrganizationModel.findById(orgId);

    if (util.isEmpty(adminUser) || util.isEmpty(org)) {
      return util.ResFail(req, res, "User or Organization not found.");
    }

    if (util.notEmpty(adminUser.password)) {
      return util.ResSuss(
        req,
        res,
        { step: 2 },
        "Account already set up password!"
      );
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
        { step: 2 },
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
    const { email, orgId } = req.query;

    const user = await AdminUsersModel.findOne({ email });
    const org = await OrganizationModel.findById(orgId);

    if (util.isEmpty(user) || util.isEmpty(org)) {
      return util.ResFail(req, res, "User or organization not found.");
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
    }/auth/set-up-password?token=${setUpToken}&email=${
      user.email
    }&orgId=${orgId}`;
    console.log(resetUrl);

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

const requestLinkSetUpPasswordOrgUser = async (req, res) => {
  try {
    const { email, orgId } = req.query;

    const user = await AdminUsersModel.findOne({ email });
    const org = await OrganizationModel.findById(orgId);

    if (util.isEmpty(user) || util.isEmpty(org)) {
      return util.ResFail(req, res, "User or organization not found.");
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
    }/auth/set-up-org-user-password?token=${setUpToken}&email=${
      user.email
    }&orgId=${orgId}`;
    console.log(resetUrl);

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
  const { id } = req.params;
  try {
    const user = await AdminUsersModel.findOne({
      _id: id,
    });

    if (util.isEmpty(user)) {
      return util.ResFail(req, res, "User not found.");
    }

    if (user.isSuperAdmin || user.isOrganizationSuperAdmin) {
      return util.ResFail(
        req,
        res,
        "Super Admin or Organization Super Admin Account can't be deleted."
      );
    }

    user.isDeleted = true;

    await user.save();

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

const update = async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, username, email, roleId } = req.body;

  try {
    const user = await AdminUsersModel.findOne({
      _id: id,
    });

    if (util.isEmpty(user)) {
      return util.ResFail(req, res, "User not found.");
    }

    const checkUserEmailExist = await AdminUsersModel.findOne({
      email: email, _id: {$ne: id}
    });

    if (util.notEmpty(checkUserEmailExist)) {
      return util.ResFail(req, res, "Email is already exist.");
    }    



    const checkExistRole = await RoleModel.findById(roleId);
        if (util.isEmpty(checkExistRole)) {
      return util.ResFail(req, res, "Role not founc.");
    }    

        if (user.isSuperAdmin || user.isOrganizationSuperAdmin) {
      return util.ResFail(
        req,
        res,
        "Super Admin or Organization Super Admin Account can't be modified.",
        400
      );
    }

    user.firstName = firstName;
    user.lastName = lastName;
    user.username = username || firstName + " " + lastName;
    user.email = email;
    user.role = roleId

    await user.save();

    return util.ResSuss(req, res, null, "Updated User Successfully.");
  } catch (error) {
    console.log(error);

    return util.ResFail(
      req,
      res,
      "An error occurred during delete. Please try again."
    );
  }
};

module.exports = {
  getAll,
  setUpPassword,
  requestLinkSetUpPassword,
  getOne,
  deleteUser,
  create,
  requestLinkSetUpPasswordOrgUser,
  update
};
