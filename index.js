require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { getDb } = require('./db/database');

const app = express();

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: '*', // In production, set this to your frontend domain
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/auth',      require('./routes/auth'));
app.use('/analyze',   require('./routes/analyze'));
app.use('/documents', require('./routes/documents'));
app.use('/contact',   require('./routes/contact'));

// ── Health check ────────────────────────────────────────────────────────────
app.use(express.static(__dirname));
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'LexSimple API' });
});

// ── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

async function start() {
  await getDb(); // initialise DB on startup
  app.listen(PORT, () => {
    console.log(`✅ LexSimple API running at http://localhost:${PORT}`);
    console.log(`   POST /auth/signup`);
    console.log(`   POST /auth/login`);
    console.log(`   POST /analyze       (multipart, requires auth)`);
    console.log(`   GET  /documents     (requires auth)`);
    console.log(`   POST /contact`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
