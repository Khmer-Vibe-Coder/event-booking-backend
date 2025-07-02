const express = require('express');
const authenticate = require("../../middlewares/authMiddleware");
const Operations = require("./upload.operation")

const router = express.Router();

router.post("/", Operations.uploadImage)

module.exports = router