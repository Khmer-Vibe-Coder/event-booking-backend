const AppUsersModel = require("../../../models/AppUsers.model");
const util = require("../../../exports/util");
const PasswordResetTokenModel = require("../../../models/PasswordResetToken.model");
const PasswordSetUpTokenModel = require("../../../models/PasswordSetUpToken.model");
const mailer = require("../../../exports/mailer");
const AdminUsersModel = require("../../../models/AdminUsers.model");
// const Organization = require("../../../models/OrganizationsRequest.model");
const RoleModel = require("../../../models/Role.model");
const OrganizationModel = require("../../../models/Organization.model");
const OrganizationsRequestModel = require("../../../models/OrganizationRequest.model");

const register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      terms,
      consents,
      orgName,
      orgEmail,
      orgDescription,
      orgPhone,
    } = req.body;

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

    const existingRequest = await OrganizationsRequestModel.findOne({
      email: normalizedEmail,
    });

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
        existingRequest.actionBy = null;
        existingRequest.phone = phone;
        existingRequest.orgName = orgName;
        existingRequest.orgDescription = orgDescription;
        existingRequest.orgEmail = orgEmail;
        existingRequest.orgPhone = orgPhone;
        const resubmitUser = await existingRequest.save();
        // Optionally: notify admin again here

        const transporter = mailer.createEmailTransporter();
        const emailTemplate = mailer.getUserRegistrationNotificationTemplate(
          resubmitUser,
          true
        );

        // send email to system admin
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
          existingRequest,
          "Your request has been re-submitted. Please wait for admin confirmation."
        );
      }
    }

    // Create a new request
    const user = await OrganizationsRequestModel.create({
      firstName,
      lastName,
      username: `${firstName} ${lastName}`,
      email: normalizedEmail,
      status: "pending",
      phone: phone,
      orgPhone: orgPhone,
      orgDescription: orgDescription,
      orgName: orgName,
      orgEmail: orgEmail,
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

const getAllRequests = async (req, res) => {
  const {
    status = "",
    search = "",
    page = 1,
    per_page = 10,
    start_created_at,
    end_created_at,
  } = req.query;

  const statusFormat = ["pending", "approved", "rejected"];

  try {
    const query = {};

    // Filter  status
    if (status && statusFormat.includes(status)) {
      query.status = status;
    }

    // Filter createdAt 
    if (start_created_at || end_created_at) {
      query.createdAt = {};
      if (start_created_at) {
        query.createdAt.$gte = new Date(start_created_at);
      }
      if (end_created_at) {
        query.createdAt.$lte = new Date(end_created_at);
      }
    }

    // Search email username
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
      ];
    }

    // Pagination
    const pageNo = util.defaultPageNo(page)
    const pageSize = util.defaultPageNo(per_page)
    const skip = (pageNo - 1) * pageSize;


    const total = await OrganizationsRequestModel.countDocuments(query);

    const organizationRequests = await OrganizationsRequestModel.find(query)
      .populate({
        path: "actionBy",
        select: "-password -createdAt -updatedAt -__v",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

      const paginate=util.getPagination(pageNo, pageSize, total, Math.ceil(total / pageSize));

    return util.ResSuss(req, res, organizationRequests, "Get all organizations requests successfully.", paginate);
    
  } catch (error) {
    console.error("getAllRequests error:", error);
    return util.ResFail(
      req,
      res,
      "Internal server error. Please try again later."
    );
  }
};


const getRequestById = async (req, res) => {

  const {id} = req.params
  try {


    const organizationsRequest = await OrganizationsRequestModel.findById(id).populate({
      path: "actionBy",
      select: "-password -createdAt -updatedAt -__v",
    });

    return util.ResSuss(
      req,
      res,
      organizationsRequest,
      "Get one organizations request successfully."
    );

  } catch (error) {
    console.error("getRequestById error:", error);
    return util.ResFail(
      req,
      res,
      "Internal server error. Please try again later."
    );
  }
};

const rejectRequest = async (req, res) => {
  const { _id } = req.user;
  const { id } = req.params;
  const { rejectReason = "" } = req.body;

  try {
    if (!util.notEmpty(rejectReason)) {
      return util.ResFail(req, res, "Reject reason is required.");
    }

    const updatedOrgRequest = await OrganizationsRequestModel.findOneAndUpdate(
      { _id: id, status: { $ne: "rejected" } },
      {
        rejectReason,
        actionBy: util.objectId(_id),
        actionAt: new Date(),
        status: "rejected",
      }
    );

    if (util.isEmpty(updatedOrgRequest)) {
      return util.ResFail(
        req,
        res,
        "Org request not found or org request is already rejected.",
        400
      );
    }
    // Send email
    const transporter = mailer.createEmailTransporter();
    const emailTemplate = mailer.getUserRejectionEmailTemplate(
      updatedOrgRequest,
      rejectReason
    );

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: updatedOrgRequest.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    return util.ResSuss(
      req,
      res,
      updatedOrgRequest,
      "Reject org request successfully."
    );
  } catch (error) {
    console.error("Reject error:", error);
    return util.ResFail(
      req,
      res,
      "Internal server error. Please try again later."
    );
  }
};

const approveRequest = async (req, res) => {
  const { _id } = req.user;
  const { id } = req.params;
  // const { roleId } = req.body;

  try {
    const existingOrg = await OrganizationsRequestModel.findOne({
      _id: id,
      status: { $nin: [ "approved"] },
    });

    if (util.isEmpty(existingOrg)) {
      return util.ResFail(
        req,
        res,
        "Org request not found or org request has already been approved.",
        400
      );
    }

    const newOrg = await OrganizationModel.create({
      name: existingOrg.orgName,
      phone: existingOrg.orgPhone,
      email: existingOrg.orgEmail,
      description: existingOrg.orgDescription,
    });

    const role = await RoleModel.findOne({name: "Organization Admin"});

    if (util.isEmpty(role)) {
      return util.ResFail(req, res, "Invalid role.");
    }

    existingOrg.status = "approved";
    existingOrg.actionBy = util.objectId(_id);
    existingOrg.actionAt = new Date();
    existingOrg.rejectReason = null;

    await existingOrg.save();

    const newAdminUser = await AdminUsersModel.create({
      firstName: existingOrg.firstName,
      lastName: existingOrg.lastName,
      username: existingOrg.username,
      email: existingOrg.email,
      phone: existingOrg.phone,
      role: util.objectId(role._id),
      organization: util.objectId(newOrg._id),
      isOrganizationSuperAdmin: true,
    });

    newOrg.adminUser = newAdminUser._id;

    await newOrg.save();

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
    }/auth/set-up-password?token=${setUpToken}&email=${
      existingOrg.email
    }&orgId=${newOrg._id}`;

    // Send email
    const transporter = mailer.createEmailTransporter();
    const emailTemplate = mailer.getPasswordSetUpEmailTemplate(
      setUpUrl,
      existingOrg.email,
      24
    );

    const result = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: existingOrg.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    console.log(result);
    

    return util.ResSuss(
      req,
      res,
      newAdminUser,
      "Approved organization successfully. Link set up password has sent to org admin user."
    );
  } catch (error) {
    console.error("approve org error:", error);
    return util.ResFail(
      req,
      res,
      "Internal server error. Please try again later."
    );
  }
};

module.exports = {
  getAllRequests,
  approveRequest,
  register,
  rejectRequest,
  getRequestById
};
