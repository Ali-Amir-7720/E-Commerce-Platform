const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false }
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client:', err.message);
  process.exit(-1);
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('[DB] Failed to connect:', err.message);
    process.exit(-1);
  }
  release();
  console.log(`[DB] Connected to "${process.env.DB_NAME}" on ${process.env.DB_HOST}:${process.env.DB_PORT}`);
});
const query = (text, params) => pool.query(text, params);

const getClient = () => pool.connect();


const withTransaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const getPoolStats = () => ({
  total: pool.totalCount,
  idle: pool.idleCount,
  waiting: pool.waitingCount,
});

const shutdown = async () => {
  await pool.end();
  console.log('[DB] Pool closed.');
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = {
  query,
  getClient,
  withTransaction,
  getPoolStats,
};
