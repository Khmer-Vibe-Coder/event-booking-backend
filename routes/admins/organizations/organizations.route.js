const express = require("express");
const authenticate = require("../../../middlewares/authMiddleware");
const Operations = require("./organizations.operation");

const router = express.Router();

router.post("/", Operations.create);
router.get("/", Operations.getAll);
router.get("/:id", Operations.getOne);
router.put("/set-image/:orgId", Operations.setImage);


module.exports = router;
