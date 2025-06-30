const express = require("express");
const authenticate = require("../../../middlewares/authMiddleware");
const Operations = require("./roles.operation");

const router = express.Router();

router.post("/", Operations.create);

router.get("/", Operations.getAll);

module.exports = router;
