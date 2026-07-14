const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.USER,
  host: "localhost",
  database: "prysm_dev",
  port: 5432,
});

module.exports = pool;
