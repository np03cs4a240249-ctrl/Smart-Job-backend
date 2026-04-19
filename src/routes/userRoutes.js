const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");

const { authMiddleware } = require("../middleware/authMiddleware");
const userController = require("../controllers/userController");

// ================= MULTER FOR PROFILE PHOTO =================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/profile/");
  },
  filename: function (req, file, cb) {
    const uniqueName = `user_${req.user.id}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/png" ||
      file.mimetype === "image/jpg" ||
      file.mimetype === "image/webp"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// ================= PROFILE ROUTES =================
router.get("/profile", authMiddleware, userController.getProfile);
router.put("/profile", authMiddleware, userController.updateProfile);
router.post(
  "/profile/photo",
  authMiddleware,
  upload.single("photo"),
  userController.uploadProfilePhoto
);

module.exports = router;