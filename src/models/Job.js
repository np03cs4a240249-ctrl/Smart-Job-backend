// import Sequelize data types
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// define Job model (job table)
const Job = sequelize.define('Job', {
    // primary key id
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },

    // job title
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },

    // job description
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
    },

    // job requirements
    requirements: {
        type: DataTypes.TEXT,
        allowNull: false,
    },

    // job location
    location: {
        type: DataTypes.STRING,
        allowNull: false,
    },

    // salary range (optional)
    salaryRange: {
        type: DataTypes.STRING,
        allowNull: true,
    },

    // job type (full-time, part-time, etc.)
    jobType: {
        type: DataTypes.STRING,
        allowNull: false,
    },

    // experience level (optional)
    experienceLevel: {
        type: DataTypes.STRING,
        allowNull: true,
    },

    // required skills (comma separated or JSON)
    skills: {
        type: DataTypes.STRING,
        allowNull: true,
    },

    // recruiter contact email shown to candidates
    contactEmail: {
        type: DataTypes.STRING,
        allowNull: true,
    },

    // recruiter contact phone shown to candidates
    contactPhone: {
        type: DataTypes.STRING,
        allowNull: true,
    },

    // recruiter who posted the job
    recruiterId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },

    // job status (open/closed)
    status: {
        type: DataTypes.ENUM('open', 'closed'),
        defaultValue: 'open',
    },
});

// export model
module.exports = Job;