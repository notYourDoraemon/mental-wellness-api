const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { validate, moodValidation, usernameValidation, dateValidation, paginationValidation } = require('../middleware/validate');

const verifyApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return res.status(401).json({ error: 'API key required' });

  const user = db.prepare('SELECT id FROM users WHERE api_key = ?').get(apiKey);
  if (!user) return res.status(403).json({ error: 'Invalid API key' });

  req.user = user;
  next();
};

router.post('/moods', verifyApiKey, validate(moodValidation), (req, res) => {
  const { mood, feeling, notes } = req.body;
  const stmt = db.prepare('INSERT INTO mood_entries (user_id, mood, feeling, notes) VALUES (?, ?, ?, ?)');
  const result = stmt.run(req.user.id, mood, feeling, notes);
  res.status(201).json({ id: result.lastInsertRowid, mood, feeling, notes });
});

router.get('/moods/:username', validate([...usernameValidation, ...paginationValidation]), (req, res) => {
  const { username } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const stmt = db.prepare(`
    SELECT id, mood, feeling, notes, created_at 
    FROM mood_entries 
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `);
  const countStmt = db.prepare('SELECT COUNT(*) as total FROM mood_entries WHERE user_id = ?');
  const entries = stmt.all(user.id, limit, offset);
  const { total } = countStmt.get(user.id);

  res.json({
    entries,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
});

router.get('/moods/date/:username/:date', validate([...usernameValidation, ...dateValidation]), (req, res) => {
  const { username, date } = req.params;
  const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const stmt = db.prepare(`
    SELECT id, mood, feeling, notes, created_at 
    FROM mood_entries 
    WHERE user_id = ? AND DATE(created_at) = ?
  `);
  const entries = stmt.all(user.id, date);
  res.json(entries);
});

router.get('/stats/:username', validate(usernameValidation), (req, res) => {
  const { username } = req.params;
  const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const topMoods = db.prepare(`
    SELECT mood, COUNT(*) as count 
    FROM mood_entries 
    WHERE user_id = ?
    GROUP BY mood 
    ORDER BY count DESC 
    LIMIT 5
  `).all(user.id);

  const topFeelings = db.prepare(`
    SELECT feeling, COUNT(*) as count 
    FROM mood_entries 
    WHERE user_id = ? AND feeling IS NOT NULL
    GROUP BY feeling 
    ORDER BY count DESC 
    LIMIT 5
  `).all(user.id);

  res.json({ topMoods, topFeelings });
});

router.delete('/moods/:id', verifyApiKey, (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare('DELETE FROM mood_entries WHERE id = ? AND user_id = ?');
  const result = stmt.run(id, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Entry not found or not authorized' });
  res.json({ message: 'Mood entry deleted' });
});

module.exports = router;