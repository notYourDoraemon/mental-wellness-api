const { Client } = require('@vercel/postgres'); // Use Client instead of Pool if Pool is deprecated or not available

const client = new Client({
  connectionString: process.env.POSTGRES_URL,
});

client.connect()
  .then(() => console.log('Connected to Neon Postgres'))
  .catch(err => console.error('Database connection error:', err));

module.exports = client;