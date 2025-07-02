const util = require("../exports/util");

const checkAuthorize = (right) => {
  return async (req, res, next) => {
    const user = req.user;
    if (user.isSuperAdmin) {
      next();
      return
    }
    const rights = user.role?.rights.map((r) => r.name);
    console.log(rights, right);
    
    const isAllowed = rights.includes(right.toString());

    if (!isAllowed) {
      return util.ResFail(
        req,
        res,
        "You don't have permission to do this.",
        403
      );
    }

    next();
  };
};

module.exports = { checkAuthorize };
