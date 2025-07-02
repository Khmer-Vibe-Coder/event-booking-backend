const express = require('express');
const authenticate = require('../middlewares/authMiddleware');

const router = express.Router();

router.use("/app", require("./apps/index.route"));


router.use("/admin", require("./admins/index.route"));
router.use("/upload", require("./upload/upload.route"))


module.exports = router