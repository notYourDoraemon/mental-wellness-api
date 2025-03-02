const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

pool.connect()
  .then(() => console.log('Connected to Neon Postgres'))
  .catch(err => console.error('Database connection error:', err));

module.exports = pool;