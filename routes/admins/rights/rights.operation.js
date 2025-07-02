const util = require("../../../exports/util");
const RightModel = require("../../../models/Right.model");

const getAll = async (req, res)=>{
      try {
    
        const rights = await RightModel.find().select("-__v -updatedAt");
        util.ResSuss(req, res, rights, "get all wights successfully.");
      } catch (error) {
        console.error("Right get all error:", error);
        return util.ResFail(req, res, "An error occurred. Please try again.");
      }
}

module.exports = {getAll}