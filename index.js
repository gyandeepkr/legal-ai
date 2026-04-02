require('dotenv').config();
const express = require('express');

const app = express();

// Manual CORS — works on all Vercel serverless functions
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json());
app.use(express.static(__dirname));

app.use('/auth',    require('./routes/auth'));
app.use('/analyze', require('./routes/analyze'));
app.use('/contact', require('./routes/contact'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => res.status(500).json({ error: err.message }));

module.exports = app;