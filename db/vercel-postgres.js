const { Pool } = require('@vercel/postgres');
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

pool.connect()
  .then(() => console.log('Connected to Vercel Postgres'))
  .catch(err => console.error('Database connection error:', err));

module.exports = pool;