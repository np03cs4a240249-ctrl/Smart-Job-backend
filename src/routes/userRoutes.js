const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const { authMiddleware } = require("../middleware/authMiddleware");
const userController = require("../controllers/userController");

const uploadDir = path.join(__dirname, "../../uploads/profile");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "-");
    cb(null, `user_${req.user.id}_${Date.now()}${path.extname(safeName)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPG, PNG, and WEBP images are allowed"));
  },
});

router.get("/profile", authMiddleware, userController.getProfile);
router.put("/profile", authMiddleware, upload.single("profileImage"), userController.updateProfile);
router.post("/profile/photo", authMiddleware, upload.single("photo"), userController.uploadProfilePhoto);
router.get("/:id", authMiddleware, userController.getPublicProfile);

module.exports = router;
