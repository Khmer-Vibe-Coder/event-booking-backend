const express = require("express");
const app = express();

const Operations = require("./auth.operation");
const authenticate = require("../../../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", Operations.register);
router.post("/login", Operations.login);
router.post('/forgot-password', Operations.forgotPassword);
router.get('/verify-reset-token', Operations.verifyResetToken);
router.post('/reset-password', Operations.resetPassword);
router.get('/me',authenticate, Operations.getMe);

module.exports = router;