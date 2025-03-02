const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { validate, journalValidation, usernameValidation, paginationValidation } = require('../middleware/validate');

const verifyApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return res.status(401).json({ error: 'API key required' });

  const user = db.prepare('SELECT id FROM users WHERE api_key = ?').get(apiKey);
  if (!user) return res.status(403).json({ error: 'Invalid API key' });

  req.user = user;
  next();
};

const calculateSentiment = (content) => {
  const positiveWords = ['happy', 'great', 'good', 'awesome', 'love'];
  const negativeWords = ['sad', 'bad', 'terrible', 'hate', 'awful'];
  const words = content.toLowerCase().split(/\s+/);
  let score = 0;

  words.forEach(word => {
    if (positiveWords.includes(word)) score += 0.2;
    if (negativeWords.includes(word)) score -= 0.2;
  });

  return Math.max(-1, Math.min(1, score));
};

router.post('/journal', verifyApiKey, validate(journalValidation), (req, res) => {
  const { title, content, tags } = req.body;
  const sentimentScore = calculateSentiment(content);
  const stmt = db.prepare(`
    INSERT INTO journal_entries (user_id, title, content, tags, sentiment_score)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(req.user.id, title, content, tags, sentimentScore);
  res.status(201).json({ id: result.lastInsertRowid, title, content, tags, sentiment_score: sentimentScore });
});

router.get('/journal/:username', validate([...usernameValidation, ...paginationValidation]), (req, res) => {
  const { username } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const stmt = db.prepare(`
    SELECT id, title, content, tags, sentiment_score, created_at 
    FROM journal_entries 
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `);
  const countStmt = db.prepare('SELECT COUNT(*) as total FROM journal_entries WHERE user_id = ?');
  const entries = stmt.all(user.id, limit, offset);
  const { total } = countStmt.get(user.id);

  res.json({
    entries,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
});

router.get('/journal/stats/:username', validate(usernameValidation), (req, res) => {
  const { username } = req.params;
  const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const avgSentiment = db.prepare(`
    SELECT AVG(sentiment_score) as avg_sentiment 
    FROM journal_entries 
    WHERE user_id = ?
  `).get(user.id);

  const topTags = db.prepare(`
    SELECT tags, COUNT(*) as count 
    FROM journal_entries 
    WHERE user_id = ? AND tags IS NOT NULL
    GROUP BY tags 
    ORDER BY count DESC 
    LIMIT 5
  `).all(user.id);

  res.json({
    average_sentiment: avgSentiment.avg_sentiment || 0,
    top_tags: topTags
  });
});

router.delete('/journal/:id', verifyApiKey, (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare('DELETE FROM journal_entries WHERE id = ? AND user_id = ?');
  const result = stmt.run(id, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Entry not found or not authorized' });
  res.json({ message: 'Journal entry deleted' });
});

module.exports = router;