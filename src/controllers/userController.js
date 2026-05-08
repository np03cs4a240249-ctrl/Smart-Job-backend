const { User, Company, Job } = require("../models");
const { sanitizeObject } = require("../utils/security");

const publicUserFields = [
  "id",
  "name",
  "role",
  "bio",
  "overview",
  "skills",
  "location",
  "website",
  "companyType",
  "profileImage",
  "companyId",
];

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
      include: [{ model: Company, as: "company", required: false }],
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    console.error("getProfile error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const body = sanitizeObject(req.body || {});
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Company, as: "company", required: false }],
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    [
      "name",
      "phoneNumber",
      "bio",
      "overview",
      "skills",
      "location",
      "website",
      "companyType",
    ].forEach((field) => {
      if (body[field] !== undefined) user[field] = body[field];
    });

    if (req.file) {
      user.profileImage = `uploads/profile/${req.file.filename}`;
    }
    await user.save();

    if (user.role === "recruiter") {
      let company = user.company;
      if (
        !company &&
        (body.companyName ||
          body.companyWebsite ||
          body.companyOverview ||
          body.companyType)
      ) {
        company = await Company.create({
          name: body.companyName || `${user.name}'s Company`,
        });
        user.companyId = company.id;
        await user.save();
      }
      if (company) {
        if (body.companyName !== undefined) company.name = body.companyName;
        if (body.companyWebsite !== undefined)
          company.website = body.companyWebsite;
        if (body.companyOverview !== undefined)
          company.about = body.companyOverview;
        if (body.companyType !== undefined)
          company.companyType = body.companyType;
        if (body.location !== undefined) company.location = body.location;
        await company.save();
      }
    }

    const updated = await User.findByPk(user.id, {
      attributes: { exclude: ["password"] },
      include: [{ model: Company, as: "company", required: false }],
    });
    res.json(updated);
  } catch (error) {
    console.error("updateProfile error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.uploadProfilePhoto = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!req.file)
      return res.status(400).json({ message: "Photo is required" });
    user.profileImage = `uploads/profile/${req.file.filename}`;
    await user.save();
    res.json(user);
  } catch (error) {
    console.error("uploadProfilePhoto error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getPublicProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: publicUserFields,
      include: [
        { model: Company, as: "company", required: false },
        {
          model: Job,
          as: "postedJobs",
          required: false,
          where:
            req.query.includeClosed === "true" ? undefined : { status: "open" },
        },
      ],
      order: [[{ model: Job, as: "postedJobs" }, "createdAt", "DESC"]],
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    console.error("getPublicProfile error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
