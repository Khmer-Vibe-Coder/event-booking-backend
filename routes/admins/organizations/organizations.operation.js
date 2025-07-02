const util = require("../../../exports/util");
const AdminUsersModel = require("../../../models/AdminUsers.model");
const OrganizationModel = require("../../../models/Organization.model");
const validator = require("validator");
const RoleModel = require("../../../models/Role.model");
const mailer = require("../../../exports/mailer");
const { vSetImage, vCreateOrg, vUpdateOrg } = require("../../../validations/admin/organizations.validation");

const setImage = async (req, res) => {
  const { orgId } = req.params;

  const {error} = vSetImage.validate(req.body)
  if(util.notEmpty(error)){
    return util.ResValidateError(error, res)
  }

  const { imageUrl } = req.body;

  try {
    const updated = await OrganizationModel.findOneAndUpdate(
      { _id: orgId, image: { $eq: null } },
      {
        image: imageUrl,
      },
      { new: true }
    );

    // console.log(updated, util.isEmpty(updated));

    if (util.isEmpty(updated)) {
      return util.ResFail(
        req,
        res,
        "Organization not found or image already upload."
      );
    }

    return util.ResSuss(req, res, null, "Image upload successfully.");
  } catch (error) {
    console.error("set image error:", error);
    return util.ResFail(req, res, "An error occurred. Please try again.");
  }
};

const create = async (req, res) => {
      const {error} = vCreateOrg.validate(req.body)
    if(util.notEmpty(error)){
      return util.ResValidateError(error, res)
    }

  const {
    firstName,
    lastName,
    email,
    phone,
    roleId,
    orgName,
    orgEmail,
    orgDescription,
    orgPhone,
  } = req.body;

  try {
    // find duplicate org
    const existingOrg = await OrganizationModel.findOne({ email: orgEmail });
    if (util.notEmpty(existingOrg)) {
      return util.ResFail(
        req,
        res,
        "Organization with this email is already exists."
      );
    }
    // find duplicate org admin
    const existingAdminUser = await AdminUsersModel.findOne({ email });

    if (util.notEmpty(existingAdminUser)) {
      return util.ResFail(req, res, "Admin user email is already exists.");
    }
    // find role for admin user
    const role = await RoleModel.findById(roleId);

    if (util.notEmpty(role)) {
      return util.ResFail(req, res, "Role not found.");
    }

    // create admin user for org
    const newAdminUser = await AdminUsersModel.create({
      firstName,
      lastName,
      username: firstName + " " + lastName,
      email: email,
      phone: phone,
      role: util.objectId(role._id),
      isOrganizationSuperAdmin: true,
    });

    // create org
    const newOrg = await OrganizationModel.create({
      name: orgName,
      description: orgDescription,
      email: orgEmail,
      phone: orgPhone,
      adminUser: newAdminUser._id,
    });

    // update admin user belong to org
    newAdminUser.organization = newOrg._id;
    await newAdminUser.save();

    //// set up password section

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
    }/auth/set-up-password?token=${setUpToken}&email=${
      newAdminUser.email
    }&orgId=${newOrg._id}`;

    console.log(setUpUrl);
    
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

    return util.ResSuss(req, res, newOrg, "Organization created successfully.");
  } catch (error) {
    console.error("Organization creation error:", error);
    return util.ResFail(req, res, "An error occurred. Please try again.");
  }
};

const update = async (req, res) => {
  const { id } = req.params;
      const {error} = vUpdateOrg.validate(req.body)
      if(util.notEmpty(error)){
        return util.ResValidateError(error, res)
      }
  const { name, description, phone, image } = req.body;

  try {
    // Build update data
    const updateData = {};
    if (util.notEmpty(name)) updateData.name = name;
    if (util.notEmpty(description)) updateData.description = description;
    // if (util.notEmpty(email)) updateData.email = email;
    if (util.notEmpty(phone)) updateData.phone = phone;
    if (image !== undefined) updateData.image = image|| null;

    const updatedOrg = await OrganizationModel.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
      }
    );

    if (!updatedOrg) {
      return util.ResFail(req, res, "Organization not found.");
    }

    return util.ResSuss(
      req,
      res,
      updatedOrg,
      "Organization updated successfully."
    );
  } catch (error) {
    console.error("Organization update error:", error);
    return util.ResFail(req, res, "An error occurred. Please try again.");
  }
};

const getAll = async (req, res) => {
  try {
    const {
      search = "",
      page,
      per_page,
      start_created_at,
      end_created_at,
    } = req.query;

    const pageNo = util.defaultPageNo(page);
    const pageSize = util.defaultPageSize(per_page);
    const skip = (pageNo - 1) * pageSize;

    const query = {};
    if (util.notEmpty(search)) {
      query.$or = [
        { email: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
      ];
    }

    if (util.notEmpty(start_created_at) || util.notEmpty(end_created_at)) {
      query.createdAt = {};
      if (util.notEmpty(start_created_at)) {
        query.createdAt.$gte = new Date(start_created_at);
      }
      if (util.notEmpty(end_created_at)) {
        query.createdAt.$lte = new Date(end_created_at);
      }
    }

    const total = await OrganizationModel.countDocuments(query);
    const organizations = await OrganizationModel.find(query)
      .populate("adminUser", "username  email _id")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    const paginate = util.getPagination(
      pageNo,
      pageSize,
      total,
      Math.ceil(total / pageSize)
    );

    return util.ResSuss(
      req,
      res,
      organizations,
      "Get all organizations successfully.",
      paginate
    );
  } catch (error) {
    console.error("Get all organizations error:", error);
    return util.ResFail(req, res, "An error occurred. Please try again.");
  }
};

const getOne = async (req, res) => {
  const { id } = req.params;

  try {
    const organization = await OrganizationModel.findById(id).populate(
      "adminUser",
      "-password -passwordChangedAt"
    );

    if (!organization) {
      return util.ResFail(req, res, "Organization not found.");
    }

    return util.ResSuss(
      req,
      res,
      organization,
      "Organization get one successfully."
    );
  } catch (error) {
    console.error("Get one organization error:", error);
    return util.ResFail(req, res, "An error occurred. Please try again.");
  }
};

module.exports = { setImage, update, create, getAll, getOne };
