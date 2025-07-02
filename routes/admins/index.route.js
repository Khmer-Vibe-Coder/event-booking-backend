const express = require('express');
const authenticate = require("../../middlewares/authMiddleware");

const router = express.Router();

router.use("/auth", require("./auth/auth.route"))
router.use("/roles", require("./roles/roles.route"))
router.use("/rights", require("./rights/rights.route"))
router.use("/organization-requests", require("./organizationRequests/organizationRequests.route"))
router.use("/organizations", require("./organizations/organizations.route"))

router.use("/users", require("./users/users.route"))

module.exports = router