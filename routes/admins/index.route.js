const express = require('express');
const authenticate = require("../../middlewares/authMiddleware");

const router = express.Router();

router.use("/auth", require("./auth/auth.route"))
router.use("/users-request", require("./usersRequest/usersRequest.route"))
router.use("/roles", require("./roles/roles.route"))
router.use("/users", require("./users/users.route"))

module.exports = router