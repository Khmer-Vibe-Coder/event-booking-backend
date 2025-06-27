const express = require("express");
const authenticate = require("../../../middlewares/authMiddleware");
const Operations = require("./usersRequest.operation");

const router = express.Router();

router.post("/register", Operations.register);

router.use(authenticate);

router.get("/", Operations.getUsersRequest);

router.put("/approve/:id", Operations.approveUserRequest);
router.put("/reject/:id", Operations.rejectUserRequest);

module.exports = router;
