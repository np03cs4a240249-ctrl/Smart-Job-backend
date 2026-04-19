const jwt = require("jsonwebtoken");
require("dotenv").config();

const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token is not valid" });
  }
};

const recruiterMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== "recruiter") {
    return res.status(403).json({ message: "Access denied. Recruiters only." });
  }
  next();
};

const candidateMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== "candidate") {
    return res.status(403).json({ message: "Access denied. Candidates only." });
  }
  next();
};

module.exports = {
  authMiddleware,
  recruiterMiddleware,
  candidateMiddleware,
};