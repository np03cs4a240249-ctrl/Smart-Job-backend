const path = require("path");
// import models
const { Application, Job, User, Company } = require("../models");

const normalizeResumeUrl = (item) => {
  // Keep resumeUrl as a relative backend upload path, for example:
  // uploads/1778161541951.pdf
  // The frontend will convert it to http://localhost:5000/uploads/...
  if (!item || !item.resumeUrl) return item;

  item.resumeUrl = String(item.resumeUrl)
    .replace(/\\/g, "/")
    .replace(/^http:\/\/localhost:5000\//, "")
    .replace(/^http:\/\/127\.0\.0\.1:5000\//, "")
    .replace(/^http:\/\/localhost\//, "")
    .replace(/^localhost\//, "")
    .replace(/^\/+/, "");

  return item;
};

/*  APPLY FOR JOB */
exports.applyForJob = async (req, res) => {
  try {
    // get data from request body
    const { jobId, fullName, email, phone, coverLetter } = req.body;
    const candidateId = req.user.id; // logged-in user

    // basic validation
    if (!jobId || !fullName || !email) {
      return res.status(400).json({
        message: "jobId, fullName and email are required",
      });
    }

    // check if job exists
    const job = await Job.findByPk(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // prevent duplicate applications
    const existingApplication = await Application.findOne({
      where: { jobId, candidateId },
    });

    if (existingApplication) {
      return res.status(400).json({
        message: "You have already applied for this job",
      });
    }

    // check resume file
    if (!req.file) {
      return res.status(400).json({ message: "Resume is required" });
    }

    // Store only a clean relative upload path in MySQL.
    // This avoids iframe errors such as localhost refused to connect.
    const resumeUrl = `uploads/${req.file.filename}`;
    const resumeName = req.file.originalname;

    // create application
    const application = await Application.create({
      jobId,
      candidateId,
      fullName,
      email,
      phone,
      coverLetter,
      resumeUrl,
      resumeName,
      status: "pending",
    });

    return res.status(201).json({
      message: "Application submitted successfully",
      application,
    });
  } catch (err) {
    console.error("applyForJob error:", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

/*  GET JOB APPLICATIONS (RECRUITER)  */
exports.getApplicationsForJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    // check job exists
    const job = await Job.findByPk(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // authorization check (only recruiter who posted job)
    if (job.recruiterId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // fetch applications for job
    const applications = await Application.findAll({
      where: { jobId },
      include: [
        {
          model: User,
          as: "candidate",
          attributes: ["id", "name", "email", "role", "phoneNumber", "bio", "overview", "skills", "location", "website", "profileImage"],
        },
      ],
      order: [["appliedAt", "DESC"]],
    });

    const formattedApplications = applications.map((application) => {
      const appJson = application.toJSON ? application.toJSON() : application;
      return normalizeResumeUrl(appJson);
    });

    return res.json(formattedApplications);
  } catch (err) {
    console.error("getApplicationsForJob error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

/*GET MY APPLICATIONS (CANDIDATE) */
exports.getMyApplications = async (req, res) => {
  try {
    const applications = await Application.findAll({
      where: { candidateId: req.user.id },
      include: [
        {
          model: Job,
          as: "job",
          attributes: [
            "id",
            "title",
            "location",
            "status",
            "salaryRange",
            "jobType",
            "experienceLevel",
            "contactEmail",
            "contactPhone",
          ],
          include: [
            {
              model: User,
              as: "recruiter",
              attributes: ["id", "name", "email", "role", "phoneNumber", "bio", "overview", "skills", "location", "website", "profileImage"],
              include: [
                {
                  model: Company,
                  as: "company",
                  attributes: ["id", "name"],
                  required: false,
                },
              ],
            },
          ],
        },
      ],
      order: [["appliedAt", "DESC"]],
    });

    const formattedApplications = applications.map((application) => {
      const appJson = application.toJSON ? application.toJSON() : application;
      return normalizeResumeUrl(appJson);
    });

    return res.json(formattedApplications);
  } catch (err) {
    console.error("getMyApplications error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

/*  UPDATE APPLICATION STATUS */
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    // allowed status values
    const allowedStatuses = ["pending", "in review", "rejected", "accepted"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // find application
    const application = await Application.findByPk(id, {
      include: [{ model: Job, as: "job" }],
    });

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // only recruiter can update
    if (application.job.recruiterId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // update status
    application.status = status;
    await application.save();

    return res.json({
      message: "Application status updated successfully",
      application,
    });
  } catch (err) {
    console.error("updateApplicationStatus error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

/*CHECK APPLICATION STATUS  */
exports.checkApplicationStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    const candidateId = req.user.id;

    // check if already applied
    const application = await Application.findOne({
      where: { jobId, candidateId },
    });

    if (application) {
      return res.json({
        hasApplied: true,
        status: application.status,
        applicationId: application.id,
      });
    }

    return res.json({ hasApplied: false });
  } catch (err) {
    console.error("checkApplicationStatus error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

/*  GET RECRUITER APPLICATIONS  */
exports.getRecruiterApplications = async (req, res) => {
  try {
    const applications = await Application.findAll({
      include: [
        {
          model: Job,
          as: "job",
          where: { recruiterId: req.user.id },
          attributes: ["id", "title", "location", "status", "contactEmail", "contactPhone"]
        },
        {
          model: User,
          as: "candidate",
          attributes: ["id", "name", "email", "role", "phoneNumber", "bio", "overview", "skills", "location", "website", "profileImage"],
        },
      ],
      order: [["appliedAt", "DESC"]],
    });

    console.log("Logged in recruiter ID:", req.user.id);
    const formattedApplications = applications.map((application) => {
      const appJson = application.toJSON ? application.toJSON() : application;
      return normalizeResumeUrl(appJson);
    });

    return res.json(formattedApplications);
  } catch (err) {
    console.error("getRecruiterApplications error:", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

/* CANCEL APPLICATION (CANDIDATE) */
exports.cancelApplication = async (req, res) => {
  try {
    const application = await Application.findByPk(req.params.id);
    if (!application) return res.status(404).json({ message: "Application not found" });
    if (application.candidateId !== req.user.id) return res.status(403).json({ message: "Not authorized" });
    await application.destroy();
    return res.json({ message: "Application cancelled successfully" });
  } catch (err) {
    console.error("cancelApplication error:", err.message);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
