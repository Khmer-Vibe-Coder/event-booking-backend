const express = require("express");
const authenticate = require("../../../middlewares/authMiddleware");
const Operations = require("./users.operation");
const { checkAuthorize } = require("../../../middlewares/checkAuthorizeMiddleware");
const { rights } = require("../../../exports/right-permissions");

const router = express.Router();


router.post("/set-up-password", Operations.setUpPassword);
router.get("/set-up-password-request-link", Operations.requestLinkSetUpPassword);
router.get("/set-up-org-user-password-request-link", Operations.requestLinkSetUpPasswordOrgUser);

router.use(authenticate);

router.post("/", Operations.create);
router.get("/", checkAuthorize(rights.AdminUser_Viewing_Access), Operations.getAll);
router.get("/:id",checkAuthorize(rights.AdminUser_Viewing_Access), Operations.getOne);
router.put("/:id", Operations.update);

router.delete("/:id", Operations.deleteUser);





module.exports = router;
