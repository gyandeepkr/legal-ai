require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static(__dirname));

app.use('/auth',      require('./routes/auth'));
app.use('/analyze',   require('./routes/analyze'));
app.use('/contact',   require('./routes/contact'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'LexSimple API' });
});

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => res.status(500).json({ error: err.message }));

module.exports = app;