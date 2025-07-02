const express = require("express");
const authenticate = require("../../../middlewares/authMiddleware");
const Operations = require("./rights.operation");
const { checkAuthorize } = require("../../../middlewares/checkAuthorizeMiddleware");

const router = express.Router();
router.use(authenticate)

router.get("/", Operations.getAll);

module.exports = router;
