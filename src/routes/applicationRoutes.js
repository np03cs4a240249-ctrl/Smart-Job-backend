const express = require("express");
const router = express.Router();
const applicationController = require("../controllers/applicationController");
const {
  authMiddleware,
  recruiterMiddleware,
  candidateMiddleware,
} = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed!"));
    }
  },
});

router.post(
  "/",
  authMiddleware,
  candidateMiddleware,
  upload.single("resume"),
  applicationController.applyForJob
);

router.get(
  "/my",
  authMiddleware,
  candidateMiddleware,
  applicationController.getMyApplications
);

router.get(
  "/check/:jobId",
  authMiddleware,
  candidateMiddleware,
  applicationController.checkApplicationStatus
);

router.get(
  "/recruiter",
  authMiddleware,
  recruiterMiddleware,
  applicationController.getRecruiterApplications
);

router.get(
  "/job/:jobId",
  authMiddleware,
  recruiterMiddleware,
  applicationController.getApplicationsForJob
);

router.patch(
  "/:id/status",
  authMiddleware,
  recruiterMiddleware,
  applicationController.updateApplicationStatus
);

module.exports = router;