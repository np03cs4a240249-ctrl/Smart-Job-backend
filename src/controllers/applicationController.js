const { Application, Job, User, Company } = require("../models");

exports.applyForJob = async (req, res) => {
  try {
    const { jobId, fullName, email, phone, coverLetter } = req.body;
    const candidateId = req.user.id;

    if (!jobId || !fullName || !email) {
      return res.status(400).json({
        message: "jobId, fullName and email are required",
      });
    }

    const job = await Job.findByPk(jobId);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const existingApplication = await Application.findOne({
      where: { jobId, candidateId },
    });

    if (existingApplication) {
      return res.status(400).json({
        message: "You have already applied for this job",
      });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Resume is required" });
    }

    const resumeUrl = req.file.path.replace(/\\/g, "/");

    const application = await Application.create({
      jobId,
      candidateId,
      fullName,
      email,
      phone,
      coverLetter,
      resumeUrl,
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

exports.getApplicationsForJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findByPk(jobId);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.recruiterId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const applications = await Application.findAll({
      where: { jobId },
      include: [
        {
          model: User,
          as: "candidate",
          attributes: ["id", "name", "email"],
        },
      ],
      order: [["appliedAt", "DESC"]],
    });

    return res.json(applications);
  } catch (err) {
    console.error("getApplicationsForJob error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

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
          ],
          include: [
            {
              model: User,
              as: "recruiter",
              attributes: ["id", "name", "email"],
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

    return res.json(applications);
  } catch (err) {
    console.error("getMyApplications error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    const allowedStatuses = ["pending", "in review", "rejected", "accepted"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const application = await Application.findByPk(id, {
      include: [{ model: Job, as: "job" }],
    });

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.job.recruiterId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

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

exports.checkApplicationStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    const candidateId = req.user.id;

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

exports.getRecruiterApplications = async (req, res) => {
  try {
    const applications = await Application.findAll({
      include: [
        {
          model: Job,
          as: "job",
          where: { recruiterId: req.user.id },
          attributes: ["id", "title", "location", "status"],
        },
        {
          model: User,
          as: "candidate",
          attributes: ["id", "name", "email"],
        },
      ],
      order: [["appliedAt", "DESC"]],
    });
    console.log("Logged in recruiter ID:", req.user.id);
    return res.json(applications);
  } catch (err) {
    console.error("getRecruiterApplications error:", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};
