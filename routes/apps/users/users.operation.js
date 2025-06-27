const AppUsersModel = require("../../../models/AppUsers.model");
const util = require("../../../exports/util");

const getUsers = async (req, res) => {
  const { isApproved } = req.query;

  try {
    const query = {};

    if (isApproved) {
      query.isApproved = isApproved;
    }

    const users = await AppUsersModel.find(query);

    return util.ResSuss(req, res, users, "Get all users.");
  } catch (error) {
    console.error("Reset password error:", error);
    return util.ResFail(
      req,
      res,
      "Internal server error. Please try again later."
    );
  }
};


module.exports = { getUsers };
