/* IMPORT SEQUELIZE */
const { Sequelize } = require('sequelize');

/* LOAD ENV VARIABLES */
require('dotenv').config();

/* CREATE DATABASE CONNECTION */
const sequelize = new Sequelize(
    process.env.DB_NAME,        // database name
    process.env.DB_USER,        // database username
    process.env.DB_PASSWORD,    // database password
    {
        host: process.env.DB_HOST,  // database host
        port: process.env.DB_PORT || 3306, // database port
        dialect: 'mysql',          // database type
        logging: false             // disable SQL logs in console
    }
);

/* EXPORT DATABASE CONNECTION */
module.exports = sequelize;