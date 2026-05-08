// import Sequelize data types
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// define Application model (job application table)
const Application = sequelize.define("Application", {
  // primary key id
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  // job reference id
  jobId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  // candidate (user) id
  candidateId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  // applicant full name
  fullName: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  // email address
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  // phone number (optional)
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  // cover letter text (optional)
  coverLetter: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // resume file URL
  resumeUrl: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  resumeName: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  // application status
  status: {
    type: DataTypes.ENUM("pending", "in review", "rejected", "accepted"),
    defaultValue: "pending",
  },

  // application date
  appliedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

// export model
module.exports = Application;