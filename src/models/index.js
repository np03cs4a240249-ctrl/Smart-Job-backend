// import sequelize and database connection
const { Sequelize } = require("sequelize");
const sequelize = require("../config/database");

// import models
const User = require("./User");
const Job = require("./Job");
const Application = require("./Application");
const SavedJob = require("./SavedJob");
const Company = require("./Company");
const PasswordReset = require("./PasswordReset");

/* -------------------- COMPANY RELATION -------------------- */
// one company has many recruiters (users)
Company.hasMany(User, { foreignKey: "companyId", as: "recruiters" });

// each recruiter belongs to a company
User.belongsTo(Company, { foreignKey: "companyId", as: "company" });

/* -------------------- JOB RELATION -------------------- */
// one user (recruiter) can post many jobs
User.hasMany(Job, { foreignKey: "recruiterId", as: "postedJobs" });

// each job belongs to one recruiter
Job.belongsTo(User, { foreignKey: "recruiterId", as: "recruiter" });

/* -------------------- APPLICATION RELATION -------------------- */
// one user (candidate) can apply to many jobs
User.hasMany(Application, { foreignKey: "candidateId", as: "applications" });

// each application belongs to one candidate
Application.belongsTo(User, { foreignKey: "candidateId", as: "candidate" });

// one job can have many applications
Job.hasMany(Application, { foreignKey: "jobId", as: "applications" });

// each application belongs to one job
Application.belongsTo(Job, { foreignKey: "jobId", as: "job" });

/* -------------------- SAVED JOB RELATION -------------------- */
// one user can save many jobs
User.hasMany(SavedJob, { foreignKey: "userId", as: "savedJobs" });

// each saved job belongs to a user
SavedJob.belongsTo(User, { foreignKey: "userId", as: "user" });

// one job can be saved by many users
Job.hasMany(SavedJob, { foreignKey: "jobId", as: "saves" });

// each saved record belongs to one job
SavedJob.belongsTo(Job, { foreignKey: "jobId", as: "job" });

/* -------------------- EXPORT MODELS -------------------- */
module.exports = {
  Sequelize,
  sequelize,
  User,
  Job,
  Application,
  SavedJob,
  Company,
  PasswordReset,
};