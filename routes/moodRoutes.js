const express = require('express');
const router = express.Router();
const db = require('../db/vercel-postgres');
const { validate, moodValidation, usernameValidation, dateValidation, paginationValidation } = require('../middleware/validate');

const verifyApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return res.status(401).json({ error: 'API key required' });

  try {
    const user = (await db.query('SELECT id FROM users WHERE api_key = $1', [apiKey])).rows[0];
    if (!user) return res.status(403).json({ error: 'Invalid API key' });

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};

router.post('/moods', verifyApiKey, validate(moodValidation), async (req, res) => {
  const { mood, feeling, notes } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO mood_entries (user_id, mood, feeling, notes) VALUES ($1, $2, $3, $4) RETURNING id',
      [req.user.id, mood, feeling, notes]
    );
    res.status(201).json({ id: result.rows[0].id, mood, feeling, notes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create mood entry' });
  }
});

router.get('/moods/:username', validate([...usernameValidation, ...paginationValidation]), async (req, res) => {
  const { username } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const user = (await db.query('SELECT id FROM users WHERE username = $1', [username])).rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    const entries = await db.query(
      'SELECT id, mood, feeling, notes, created_at FROM mood_entries WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [user.id, limit, offset]
    );
    const count = await db.query('SELECT COUNT(*) FROM mood_entries WHERE user_id = $1', [user.id]);
    const total = parseInt(count.rows[0].count, 10);

    res.json({
      entries: entries.rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch moods' });
  }
});

router.get('/moods/date/:username/:date', validate([...usernameValidation, ...dateValidation]), async (req, res) => {
  const { username, date } = req.params;
  try {
    const user = (await db.query('SELECT id FROM users WHERE username = $1', [username])).rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    const entries = await db.query(
      'SELECT id, mood, feeling, notes, created_at FROM mood_entries WHERE user_id = $1 AND DATE(created_at) = $2',
      [user.id, date]
    );
    res.json(entries.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch mood entries' });
  }
});

router.get('/stats/:username', validate(usernameValidation), async (req, res) => {
  const { username } = req.params;
  try {
    const user = (await db.query('SELECT id FROM users WHERE username = $1', [username])).rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    const topMoods = (await db.query(
      'SELECT mood, COUNT(*) as count FROM mood_entries WHERE user_id = $1 GROUP BY mood ORDER BY count DESC LIMIT 5',
      [user.id]
    )).rows;

    const topFeelings = (await db.query(
      'SELECT feeling, COUNT(*) as count FROM mood_entries WHERE user_id = $1 AND feeling IS NOT NULL GROUP BY feeling ORDER BY count DESC LIMIT 5',
      [user.id]
    )).rows;

    res.json({ topMoods, topFeelings });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.delete('/moods/:id', verifyApiKey, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM mood_entries WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Entry not found or not authorized' });
    res.json({ message: 'Mood entry deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete mood entry' });
  }
});

module.exports = router;