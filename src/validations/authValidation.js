const { check } = require("express-validator");
const strongPasswordMessage = "Password must be at least 8 characters and include one uppercase letter and one number.";
exports.registerValidation = [
  check("name", "Name is required").not().isEmpty().trim().escape(),
  check("email", "Please include a valid email").isEmail().normalizeEmail(),
  check("password", strongPasswordMessage).matches(/^(?=.*[A-Z])(?=.*\d).{8,}$/),
  check("role", "Role is required").isIn(["candidate", "recruiter"]),
];
exports.loginValidation = [
  check("email", "Please include a valid email").isEmail().normalizeEmail(),
  check("password", "Password is required").exists(),
];
