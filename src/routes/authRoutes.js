const express = require("express");
const router = express.Router();
const { registerValidation, loginValidation } = require("../validations/authValidation");
const authController = require("../controllers/authController");

router.post("/register", registerValidation, authController.register);
router.post("/login", loginValidation, authController.login);
router.post("/forgot-password", authController.requestPasswordReset);
router.get("/reset-password/:token", authController.validateResetToken);
router.post("/reset-password", authController.resetPassword);

module.exports = router;
