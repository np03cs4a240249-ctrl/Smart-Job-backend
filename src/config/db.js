/* IMPORT MYSQL2 DRIVER */
const mysql = require('mysql2');

/* LOAD ENV VARIABLES */
require('dotenv').config();

/* CREATE MYSQL CONNECTION POOL */
const pool = mysql.createPool({
  host: process.env.DB_HOST,          // database host
  user: process.env.DB_USER,          // database username
  password: process.env.DB_PASSWORD,  // database password
  database: process.env.DB_NAME,     // database name
  port: process.env.DB_PORT || 3306, // default MySQL port
  waitForConnections: true,          // wait if no connection available
  connectionLimit: 10,              // max connections in pool
  queueLimit: 0                     // unlimited queue
});

/* CONVERT POOL TO PROMISE-BASED API */
const promisePool = pool.promise();

/* EXPORT POOL */
module.exports = promisePool;