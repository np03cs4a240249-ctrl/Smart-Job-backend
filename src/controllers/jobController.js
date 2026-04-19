const { Job, User, Company, Sequelize } = require("../models");
const { Op } = Sequelize;

// ================= CREATE JOB =================
exports.createJob = async (req, res) => {
  try {
    if (req.user.role !== "recruiter") {
      return res.status(403).json({ message: "Only recruiters can post jobs" });
    }

    const {
      title,
      description,
      requirements,
      location,
      salaryRange,
      jobType,
      experienceLevel,
      skills,
    } = req.body;

    if (!title || !description || !location) {
      return res.status(400).json({
        message: "Title, description and location are required",
      });
    }

    const job = await Job.create({
      title,
      description,
      requirements,
      location,
      salaryRange,
      jobType,
      experienceLevel,
      skills,
      recruiterId: req.user.id,
      status: "open",
    });

    res.status(201).json({
      message: "Job created successfully",
      job,
    });
  } catch (err) {
    console.error("createJob error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= GET ALL JOBS =================
exports.getJobs = async (req, res) => {
  try {
    const {
      title,
      location,
      jobType,
      experienceLevel,
      sort,
      page = 1,
      limit = 10,
    } = req.query;

    const where = {};

    if (title) where.title = { [Op.like]: `%${title}%` };
    if (location) where.location = { [Op.like]: `%${location}%` };
    if (jobType) where.jobType = jobType;
    if (experienceLevel) where.experienceLevel = experienceLevel;

    let order = [["createdAt", "DESC"]];
    if (sort === "oldest") order = [["createdAt", "ASC"]];

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const offset = (pageNumber - 1) * limitNumber;

    const { count, rows } = await Job.findAndCountAll({
      where,
      order,
      limit: limitNumber,
      offset,
      include: [
        {
          model: User,
          as: "recruiter",
          attributes: ["id", "name", "email"],
          include: [
            {
              model: Company,
              as: "company",
              attributes: ["id", "name", "logo", "website", "about"],
              required: false,
            },
          ],
        },
      ],
    });

    res.json({
      jobs: rows,
      pagination: {
        total: count,
        currentPage: pageNumber,
        totalPages: Math.ceil(count / limitNumber),
        limit: limitNumber,
      },
    });
  } catch (err) {
    console.error("getJobs error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= GET JOB BY ID =================
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "recruiter",
          attributes: ["id", "name", "email"],
          include: [
            {
              model: Company,
              as: "company",
              attributes: ["id", "name", "logo", "website", "about"],
              required: false,
            },
          ],
        },
      ],
    });

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json(job);
  } catch (err) {
    console.error("getJobById error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= GET MY JOBS =================
exports.getMyJobs = async (req, res) => {
  try {
    if (req.user.role !== "recruiter") {
      return res.status(403).json({ message: "Recruiters only" });
    }

    const jobs = await Job.findAll({
      where: { recruiterId: req.user.id },
      include: [
        {
          model: User,
          as: "recruiter",
          attributes: ["id", "name", "email"],
          include: [
            {
              model: Company,
              as: "company",
              attributes: ["id", "name", "logo", "website", "about"],
              required: false,
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(jobs);
  } catch (err) {
    console.error("getMyJobs error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= UPDATE JOB =================
exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.recruiterId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const {
      title,
      description,
      requirements,
      location,
      salaryRange,
      jobType,
      experienceLevel,
      skills,
    } = req.body;

    await job.update({
      title,
      description,
      requirements,
      location,
      salaryRange,
      jobType,
      experienceLevel,
      skills,
    });

    res.json({
      message: "Job updated successfully",
      job,
    });
  } catch (err) {
    console.error("updateJob error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= CLOSE JOB =================
exports.closeJob = async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.id);

    if (!job) return res.status(404).json({ message: "Job not found" });

    if (job.recruiterId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    job.status = "closed";
    await job.save();

    res.json({ message: "Job closed", job });
  } catch (err) {
    console.error("closeJob error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= REOPEN JOB =================
exports.reopenJob = async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.recruiterId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    job.status = "open";
    await job.save();

    res.json({ message: "Job reopened", job });
  } catch (err) {
    console.error("reopenJob error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= DELETE JOB =================
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.id);

    if (!job) return res.status(404).json({ message: "Job not found" });

    if (job.recruiterId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await job.destroy();

    res.json({ message: "Job deleted successfully" });
  } catch (err) {
    console.error("deleteJob error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};