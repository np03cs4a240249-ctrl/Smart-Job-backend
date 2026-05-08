const { Job, User, Company } = require("../models");
const { Op } = require("sequelize");
const { sanitizeObject } = require("../utils/security");

const recruiterInclude = [
  {
    model: User,
    as: "recruiter",
    attributes: [
      "id",
      "name",
      "email",
      "role",
      "phoneNumber",
      "bio",
      "location",
      "website",
      "profileImage",
    ],
    include: [
      {
        model: Company,
        as: "company",
        attributes: ["id", "name", "logo", "website", "about"],
        required: false,
      },
    ],
  },
];

exports.createJob = async (req, res) => {
  try {

    if (!req.user) {
      return res.status(401).json({
        message: "Login required",
      });
    }

    const body = sanitizeObject(req.body || {});

    const {
      title,
      description,
      requirements,
      location,
      salaryRange,
      jobType,
      experienceLevel,
      skills,
      contactEmail,
      contactPhone,
    } = body;

    if (
      !title ||
      !description ||
      !requirements ||
      !location ||
      !jobType
    ) {
      return res.status(400).json({
        message:
          "Title, description, requirements, location and job type are required",
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
      contactEmail,
      contactPhone,
      recruiterId: req.user.id,
      status: "open",
    });

    res.status(201).json({
      message: "Job created successfully",
      job,
    });

  } catch (err) {

    console.error("CREATE JOB ERROR:", err);

    res.status(500).json({
      message: err.message || "Server error",
    });
  }
};

exports.getMyJobs = async (req, res) => {
  try {

    const jobs = await Job.findAll({
      where: {
        recruiterId: req.user.id,
      },
      include: recruiterInclude,
      order: [["createdAt", "DESC"]],
    });

    res.json(jobs);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Server error",
    });
  }
};

exports.getJobs = async (req, res) => {
  try {

    const {
      title,
      location,
      jobType,
      experienceLevel,
      sort,
      page = 1,
      limit = 20,
    } = req.query;

    const where = {};

    if (title) {
      where.title = {
        [Op.like]: `%${title}%`,
      };
    }

    if (location) {
      where.location = {
        [Op.like]: `%${location}%`,
      };
    }

    if (jobType) {
      where.jobType = jobType;
    }

    if (experienceLevel) {
      where.experienceLevel = experienceLevel;
    }

    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 20;

    const jobs = await Job.findAndCountAll({
      where,
      include: recruiterInclude,
      order: [
        ["createdAt", sort === "oldest" ? "ASC" : "DESC"],
      ],
      limit: limitNumber,
      offset: (pageNumber - 1) * limitNumber,
    });

    res.json({
      jobs: jobs.rows,
      pagination: {
        total: jobs.count,
        currentPage: pageNumber,
        totalPages: Math.ceil(jobs.count / limitNumber),
      },
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Server error",
    });
  }
};

exports.getJobById = async (req, res) => {
  try {

    const job = await Job.findByPk(req.params.id, {
      include: recruiterInclude,
    });

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    res.json(job);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Server error",
    });
  }
};

exports.updateJob = async (req, res) => {
  try {

    const job = await Job.findByPk(req.params.id);

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    if (job.recruiterId !== req.user.id) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    await job.update(sanitizeObject(req.body || {}));

    res.json({
      message: "Job updated successfully",
      job,
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Server error",
    });
  }
};

exports.closeJob = async (req, res) => {
  try {

    const job = await Job.findByPk(req.params.id);

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    if (job.recruiterId !== req.user.id) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    job.status = "closed";

    await job.save();

    res.json({
      message: "Job closed",
      job,
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Server error",
    });
  }
};

exports.reopenJob = async (req, res) => {
  try {

    const job = await Job.findByPk(req.params.id);

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    if (job.recruiterId !== req.user.id) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    job.status = "open";

    await job.save();

    res.json({
      message: "Job reopened",
      job,
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Server error",
    });
  }
};

exports.deleteJob = async (req, res) => {
  try {

    const job = await Job.findByPk(req.params.id);

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    if (job.recruiterId !== req.user.id) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    await job.destroy();

    res.json({
      message: "Job deleted successfully",
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Server error",
    });
  }
};