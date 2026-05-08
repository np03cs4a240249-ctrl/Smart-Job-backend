// import Sequelize data types
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// define SavedJob model (table for saved/bookmarked jobs)
const SavedJob = sequelize.define('SavedJob', {
    // primary key id
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },

    // user who saved the job
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id'
    },

    // job that is saved
    jobId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'job_id'
    },

    // time when job was saved
    savedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'saved_at'
    }
}, {
    tableName: 'saved_jobs', // database table name
    timestamps: false        // disable createdAt/updatedAt
});

// export model
module.exports = SavedJob;