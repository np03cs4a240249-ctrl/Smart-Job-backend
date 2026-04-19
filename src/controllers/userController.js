const { User } = require("../models");

// ================= GET PROFILE =================
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { password, ...safeUser } = user.toJSON();
    return res.json(safeUser);
  } catch (error) {
    console.error("getProfile error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= UPDATE PROFILE =================
exports.updateProfile = async (req, res) => {
  try {
    const { name, bio, location, website } = req.body;

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) user.name = name;
    user.bio = bio ?? user.bio;
    user.location = location ?? user.location;
    user.website = website ?? user.website;

    await user.save();

    const { password, ...safeUser } = user.toJSON();

    return res.json({
      message: "Profile updated successfully",
      user: safeUser,
    });
  } catch (error) {
    console.error("updateProfile error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= UPLOAD PROFILE PHOTO =================
exports.uploadProfilePhoto = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Photo is required" });
    }

    const imagePath = req.file.path.replace(/\\/g, "/");
    user.profileImage = imagePath;

    await user.save();

    const { password, ...safeUser } = user.toJSON();

    return res.json({
      message: "Profile photo updated successfully",
      user: safeUser,
    });
  } catch (error) {
    console.error("uploadProfilePhoto error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};