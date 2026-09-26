require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  options: "-c search_path=public,extensions",
});

module.exports = pool;
