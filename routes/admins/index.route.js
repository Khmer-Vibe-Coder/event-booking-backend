const express = require('express');
const authenticate = require("../../middlewares/authMiddleware");

const router = express.Router();

router.use("/auth", require("./auth/auth.route"))
router.use("/users-request", require("./usersRequest/usersRequest.route"))

module.exports = router