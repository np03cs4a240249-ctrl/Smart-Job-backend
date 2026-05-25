const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { User, Company, PasswordReset } = require("../models");
const { validationResult } = require("express-validator");
const { sanitizeObject, isStrongPassword } = require("../utils/security");

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  phoneNumber: user.phoneNumber || null,
  bio: user.bio || null,
  location: user.location || null,
  website: user.website || null,
  overview: user.overview || null,
  skills: user.skills || null,
  companyType: user.companyType || null,
  companyId: user.companyId || null,
  profileImage: user.profileImage || null,
});

const signToken = (user) => jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const body = sanitizeObject(req.body);
  const { name, email, password, role, companyName, companyLogo, companyWebsite, aboutCompany } = body;

  try {
    if (!["candidate", "recruiter"].includes(role)) return res.status(400).json({ message: "Invalid role" });
    if (!isStrongPassword(password)) {
      return res.status(400).json({ message: "Password must be at least 8 characters and include one uppercase letter and one number." });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    let companyId = null;

    if (role === "recruiter" && companyName) {
      const company = await Company.create({
        name: companyName,
        logo: companyLogo || null,
        website: companyWebsite || null,
        about: aboutCompany || null,
      });
      companyId = company.id;
    }

    const user = await User.create({ name, email, password: hashedPassword, role, companyId });
    res.status(201).json({ token: signToken(user), user: publicUser(user), message: "Registration successful" });
  } catch (err) {
    console.error("register error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    res.json({ token: signToken(user), user: publicUser(user), message: "Login successful" });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.requestPasswordReset = async (req, res) => {
  const { email } = sanitizeObject(req.body);
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: "No account found with that email address" });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await PasswordReset.create({ email, token, expiresAt, used: false });

    res.json({
      message: "Password reset link created. Use this token in the reset page.",
      token,
      resetUrl: `/reset-password.html?token=${token}`,
      expiresIn: "15 minutes",
    });
  } catch (err) {
    console.error("requestPasswordReset error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.validateResetToken = async (req, res) => {
  try {
    const resetRecord = await PasswordReset.findOne({ where: { token: req.params.token } });
    if (!resetRecord) return res.status(404).json({ message: "Invalid token" });
    if (resetRecord.used) return res.status(400).json({ message: "Token has already been used" });
    if (new Date() > resetRecord.expiresAt) return res.status(400).json({ message: "Token has expired" });
    res.json({ message: "Token is valid", email: resetRecord.email });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({ message: "Password must be at least 8 characters and include one uppercase letter and one number." });
    }

    const resetRecord = await PasswordReset.findOne({ where: { token } });
    if (!resetRecord) return res.status(404).json({ message: "Invalid token" });
    if (resetRecord.used) return res.status(400).json({ message: "Token has already been used" });
    if (new Date() > resetRecord.expiresAt) return res.status(400).json({ message: "Token has expired" });

    const user = await User.findOne({ where: { email: resetRecord.email } });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    resetRecord.used = true;
    await resetRecord.save();

    res.json({ message: "Password successfully reset" });
  } catch (err) {
    console.error("resetPassword error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
