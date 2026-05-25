// import Sequelize data types
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// define PasswordReset model (password reset table)
const PasswordReset = sequelize.define('PasswordReset', {
    // primary key id
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },

    // user email for password reset
    email: {
        type: DataTypes.STRING,
        allowNull: false,
    },

    // unique reset token
    token: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },

    // token expiry time
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
    },

    // whether token is already used
    used: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    tableName: 'password_resets', // database table name
    timestamps: true,              // enable createdAt
    updatedAt: false               // disable updatedAt
});

// export model
module.exports = PasswordReset;