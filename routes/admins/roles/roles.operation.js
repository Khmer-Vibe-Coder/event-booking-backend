const { log } = require("node:console");
const util = require("../../../exports/util");
const RoleModel = require("../../../models/Role.model");

const create = async (req, res) => {
  const { name } = req.body;
  const orgId = req.user.organization?._id  || null;
  try {
    const data = { name };
    if (util.notEmpty(orgId)) {
      data.organization = util.objectId(orgId);
    }

    const newRole = await RoleModel.create(data);
    util.ResSuss(req, res, null, "Role create successfully.");
  } catch (error) {
    console.error("Role create error:", error);
    return util.ResFail(req, res, "An error occurred. Please try again.");
  }
};

const update = async (req, res) => {
  const { id } = req.params;
  const { name, rights = [], orgId } = req.body;

  try {
    if (!util.notEmpty(id)) {
      return util.ResFail(req, res, "Invalid role ID.");
    }

    const updateData = { name, rights };

    if (util.notEmpty(orgId)) {
      updateData.organization = util.objectId(orgId);
    }

    const role = await RoleModel.findById(id);
    if (!role) {
      return util.ResFail(req, res, "Role not found.");
    }

    await RoleModel.findByIdAndUpdate(id, updateData, { new: true });

    return util.ResSuss(req, res, null, "Role updated successfully.");
  } catch (error) {
    console.error("Role update error:", error);
    return util.ResFail(req, res, "An error occurred. Please try again.");
  }
};

const remove = async (req, res) => {
  const { id } = req.params;

  try {

    const role = await RoleModel.findByIdAndDelete(id);

    if (!role) {
      return util.ResFail(req, res, "Role not found.");
    }

    return util.ResSuss(req, res, null, "Role deleted successfully.");
  } catch (error) {
    console.error("Role delete error:", error);
    return util.ResFail(req, res, "An error occurred. Please try again.");
  }
};

// scope
const getAll = async (req, res) => {
  const {
    search = "",
    page,
    per_page,
    start_created_at,
    end_created_at,
  } = req.query;
  console.log(req.user);
  
  const orgId = req.user.organization?._id || null;

  try {
    const pageNo = util.defaultPageNo(page);
    const pageSize = util.defaultPageSize(per_page);
    const skip = (pageNo - 1) * pageSize

    const query = {};

    query.organization = orgId

    // Search by name
    if (util.notEmpty(search)) {
      query.name = { $regex: search, $options: "i" };
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

    const total = await RoleModel.countDocuments(query);

    const roles = await RoleModel.find(query)
      .populate("rights", "-__v -createdAt -updatedAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);
      // console.log(roles[0].rights);
      

      const paginate = util.getPagination(pageNo, pageSize, total, Math.ceil(total / pageSize))

    return util.ResSuss(req, res, roles, "Get all roles successfully.",paginate);
  } catch (error) {
    console.error("Get all roles error:", error);
    return util.ResFail(req, res, "An error occurred. Please try again.");
  }
};


const getOne = async (req, res) => {
  const {id} = req.params
  try {
    const role = await RoleModel.findById(id).populate("rights");

    if(util.isEmpty(role)){
      return util.ResFail(req, res, "Role not found.");
    }
    
    util.ResSuss(req, res, role, "Get all roles successfully.");
  } catch (error) {
    console.error("Role create error:", error);
    return util.ResFail(req, res, "An error occurred. Please try again.");
  }
};

module.exports = { create, getAll, update, remove , getOne};
