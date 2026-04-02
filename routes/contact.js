const express = require('express');
const { getDb, saveDb } = require('../db/database');

const router = express.Router();

// POST /contact
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const db = await getDb();
    db.run(
      `INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)`,
      [name, email, subject || '', message || '']
    );
    saveDb();

    res.json({ success: true, message: 'Message received! We will reply within 1 business day.' });
  } catch (err) {
    console.error('Contact error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;
