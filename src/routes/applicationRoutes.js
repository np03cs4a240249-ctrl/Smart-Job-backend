// import required packages
const express = require("express");
const router = express.Router();
const applicationController = require("../controllers/applicationController");
const {
  authMiddleware,
  recruiterMiddleware,
  candidateMiddleware,
} = require("../middleware/authMiddleware");

const multer = require("multer"); // file upload middleware
const path = require("path");

// file storage configuration for uploaded files
const storage = multer.diskStorage({
  // set upload folder
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },

  // set file name (unique name using timestamp)
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// multer setup with file validation
const upload = multer({
  storage,

  // allow only PDF files
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed!"));
    }
  },
});

/* -------------------- ROUTES -------------------- */

// apply for a job (candidate only)
router.post(
  "/",
  authMiddleware,
  candidateMiddleware,
  upload.single("resume"),
  applicationController.applyForJob
);

// get logged-in user's applications (candidate only)
router.get(
  "/my",
  authMiddleware,
  candidateMiddleware,
  applicationController.getMyApplications
);

// check if user already applied for a job
router.get(
  "/check/:jobId",
  authMiddleware,
  candidateMiddleware,
  applicationController.checkApplicationStatus
);

// cancel application (candidate only)
router.delete(
  "/:id",
  authMiddleware,
  candidateMiddleware,
  applicationController.cancelApplication
);

// recruiter: get all applications
router.get(
  "/recruiter",
  authMiddleware,
  recruiterMiddleware,
  applicationController.getRecruiterApplications
);

// recruiter: get applications for a specific job
router.get(
  "/job/:jobId",
  authMiddleware,
  recruiterMiddleware,
  applicationController.getApplicationsForJob
);

// recruiter: update application status (accept/reject)
router.patch(
  "/:id/status",
  authMiddleware,
  recruiterMiddleware,
  applicationController.updateApplicationStatus
);

// export router
module.exports = router;