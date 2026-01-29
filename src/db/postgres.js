import dotenv from "dotenv";
// dotenv.config({ path: "./.env" });
import pkg from "pg";
const { Pool } = pkg;

// Determine environment
const env = process.env.NODE_ENV || 'development';

// Select credentials based on environment
const config = {
  user: env === 'production' ? process.env.PG_USER_PROD : process.env.PG_USER_DEV,
  host: env === 'production' ? process.env.PG_HOST_PROD : process.env.PG_HOST_DEV,
  database: env === 'production' ? process.env.PG_DB_PROD : process.env.PG_DB_DEV,
  password: env === 'production' ? process.env.PG_PASSWORD_PROD : process.env.PG_PASSWORD_DEV,
  port: env === 'production' ? process.env.PG_PORT_PROD : process.env.PG_PORT_DEV,
  ssl: {
    rejectUnauthorized: false
  }
}

// const pool = new Pool(config);
const pool = new Pool({
  ...config,
  max: 8,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});


// Safe connection check
const checkConnection = async () => {
  try {
    const client = await pool.connect();
    console.log(`\nPostgreSQL Connected! \nHost: ${config.host}\nDatabase: ${config.database}\nUser: ${config.user}\nEnvironment: ${env}`);
    client.release();
  } catch (err) {
    console.error("PostgreSQL connection FAILED:", err.message);
  }
};

checkConnection();

export default pool;
