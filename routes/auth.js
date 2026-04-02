const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb, saveDb } = require('../db/database');

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password are required' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const db = await getDb();
    const existing = db.exec(`SELECT id FROM users WHERE email = '${email.replace(/'/g, "''")}'`);
    if (existing.length && existing[0].values.length)
      return res.status(409).json({ error: 'Email already in use' });

    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(`INSERT INTO users (name, email, password) VALUES (?, ?, ?)`, [name, email, hashedPassword]);
    saveDb();

    const result = db.exec(`SELECT id FROM users WHERE email = '${email.replace(/'/g, "''")}'`);
    const userId = result[0].values[0][0];
    const token = jwt.sign({ id: userId, email, name }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, user: { id: userId, name, email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });

    const db = await getDb();
    const result = db.exec(`SELECT id, name, email, password FROM users WHERE email = '${email.replace(/'/g, "''")}'`);
    if (!result.length || !result[0].values.length)
      return res.status(401).json({ error: 'Invalid email or password' });

    const [id, name, userEmail, hashedPassword] = result[0].values[0];
    const isValid = await bcrypt.compare(password, hashedPassword);
    if (!isValid)
      return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ id, email: userEmail, name }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id, name, email: userEmail } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

router.get('/me', require('../middleware/auth'), async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;