require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 20, // Example
  idleTimeoutMillis: 30000, // Example: 30 seconds
  min: 2, // Example
});

pool
  .connect()
  .then(() => {
    console.log("Connected to Supabase!");
    // pool.end();
  })
  .catch((err) => {
    console.error("Error connecting to Supabase:", err);
  });

module.exports = pool;
