const express = require("express");
const authenticate = require("../../../middlewares/authMiddleware");
const Operations = require("./roles.operation");
const { checkAuthorize } = require("../../../middlewares/checkAuthorizeMiddleware");

const router = express.Router();
router.use(authenticate)

router.post("/", checkAuthorize("Role_Management_Access"), Operations.create);
router.get("/",checkAuthorize("Role_Viewing_Access"), Operations.getAll);
router.put("/:id", Operations.update);
router.get("/:id", Operations.getOne);
router.delete("/:id", Operations.remove);
module.exports = router;
