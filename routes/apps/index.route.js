const express = require('express');
const authenticate = require("../../middlewares/authMiddleware");

const router = express.Router();

// router.use(authenticate);

router.use("/auth", require("./auth/auth.route"))
router.use("/users", require("./users/users.route"))

module.exports = router