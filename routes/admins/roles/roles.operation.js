const util = require("../../../exports/util");
const RoleModel = require("../../../models/Role.model");

const create = async (req, res) => {
  const { name } = req.body;
  try {
    const newRole = await RoleModel.create({ name });
    util.ResSuss(req, res, null, "Role create successfully.");
  } catch (error) {
    console.error("Role create error:", error);
    return util.ResFail(req, res, "An error occurred. Please try again.");
  }
};
const getAll = async (req, res) => {

  try {
    const roles = await RoleModel.find({});
    util.ResSuss(req, res, roles,"Get all roles successfully.");
  } catch (error) {
    console.error("Role create error:", error);
    return util.ResFail(req, res, "An error occurred. Please try again.");
  }
};

module.exports = {create, getAll}