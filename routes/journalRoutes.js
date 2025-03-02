const express = require('express');
const router = express.Router();
const db = require('../db/vercel-postgres');
const { validate, journalValidation, usernameValidation, paginationValidation } = require('../middleware/validate');

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

router.post('/journal', verifyApiKey, validate(journalValidation), async (req, res) => {
  const { title, content, tags } = req.body;
  const sentimentScore = calculateSentiment(content);
  try {
    const result = await db.query(
      'INSERT INTO journal_entries (user_id, title, content, tags, sentiment_score) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [req.user.id, title, content, tags, sentimentScore]
    );
    res.status(201).json({ id: result.rows[0].id, title, content, tags, sentiment_score: sentimentScore });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create journal entry' });
  }
});

router.get('/journal/:username', validate([...usernameValidation, ...paginationValidation]), async (req, res) => {
  const { username } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const user = (await db.query('SELECT id FROM users WHERE username = $1', [username])).rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    const entries = await db.query(
      'SELECT id, title, content, tags, sentiment_score, created_at FROM journal_entries WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [user.id, limit, offset]
    );
    const count = await db.query('SELECT COUNT(*) FROM journal_entries WHERE user_id = $1', [user.id]);
    const total = parseInt(count.rows[0].count, 10);

    res.json({
      entries: entries.rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch journal entries' });
  }
});

router.get('/journal/stats/:username', validate(usernameValidation), async (req, res) => {
  const { username } = req.params;
  try {
    const user = (await db.query('SELECT id FROM users WHERE username = $1', [username])).rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    const avgSentiment = (await db.query(
      'SELECT AVG(sentiment_score) as avg_sentiment FROM journal_entries WHERE user_id = $1',
      [user.id]
    )).rows[0];

    const topTags = (await db.query(
      'SELECT tags, COUNT(*) as count FROM journal_entries WHERE user_id = $1 AND tags IS NOT NULL GROUP BY tags ORDER BY count DESC LIMIT 5',
      [user.id]
    )).rows;

    res.json({
      average_sentiment: avgSentiment.avg_sentiment || 0,
      top_tags: topTags
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.delete('/journal/:id', verifyApiKey, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM journal_entries WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Entry not found or not authorized' });
    res.json({ message: 'Journal entry deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete journal entry' });
  }
});

module.exports = router;