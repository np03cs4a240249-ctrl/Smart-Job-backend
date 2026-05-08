// import Sequelize data types
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// define Company model
const Company = sequelize.define('Company', {
    // primary key id
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },

    // company name
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },

    // company logo (stored as base64 or long text)
    logo: {
        type: DataTypes.TEXT('long'),
        allowNull: true,
    },

    // company website link
    website: {
        type: DataTypes.STRING,
        allowNull: true,
    },

    // about company description
    about: {
        type: DataTypes.TEXT,
        allowNull: true,
    },

    companyType: {
        type: DataTypes.STRING,
        allowNull: true,
    },

    location: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    tableName: 'companies', // database table name
    timestamps: true,       // enable timestamps
    createdAt: 'created_at', // custom created date field name
    updatedAt: false        // disable updatedAt field
});

// export model
module.exports = Company;