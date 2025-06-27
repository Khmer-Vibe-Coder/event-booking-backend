const express = require("express");
const authenticate = require("../../../middlewares/authMiddleware");
const Operations = require("./users.operation");

const router = express.Router();


router.post("/set-up-password", Operations.setUpPassword);
router.get("/set-up-password-request-link", Operations.requestLinkSetUpPassword);

router.use(authenticate);

router.get("/", Operations.getAll);
router.get("/:id", Operations.getOne);

router.delete("/:id", Operations.deleteUser);





module.exports = router;
