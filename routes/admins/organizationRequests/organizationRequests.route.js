const express = require("express");
const authenticate = require("../../../middlewares/authMiddleware");
const Operations = require("./organizationRequests.operation");
const { rights } = require("../../../exports/right-permissions");
const { checkAuthorize } = require("../../../middlewares/checkAuthorizeMiddleware");

const router = express.Router();

router.use(authenticate);


router.post("/register", Operations.register);

router.get("/", checkAuthorize(rights.Organization_Request_Viewing_Access), Operations.getAllRequests);

router.put("/approve/:id", checkAuthorize(rights.Organization_Request_Confirmation_Access), Operations.approveRequest);
router.put("/reject/:id", checkAuthorize(rights.Organization_Request_Confirmation_Access), Operations.rejectRequest);

module.exports = router;
