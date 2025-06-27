const express = require('express');

const router = express.Router();

router.use("/app", require("./apps/index.route"));
router.use("/admin", require("./admins/index.route"));


module.exports = router