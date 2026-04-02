const express = require('express');
const multer = require('multer');
const authMiddleware = require('../middleware/auth');


const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === 'text/plain' || file.originalname.endsWith('.txt')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and TXT files are supported'));
    }
  }
});

async function extractText(file) {
  const raw = file.buffer.toString('utf-8');
  return raw.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
}

async function analyzeWithGemini(text, options = []) {
  const optionsNote = options.length ? `Focus especially on: ${options.join(', ')}.` : '';

  const prompt = `You are a legal document analyst. Analyze the following legal document and return a JSON response only (no markdown, no explanation outside JSON).

${optionsNote}

Return this exact JSON structure:
{
  "summary": "2-4 sentence plain-English overview",
  "risks": [{ "label": "Short risk title", "detail": "One sentence explanation", "level": "high|medium|low" }],
  "dates": [{ "label": "What this date is", "date": "The date or deadline" }],
  "clauses": [{ "title": "Clause name", "plain": "Plain English explanation", "tag": "payment|termination|liability|confidentiality|ip|general" }],
  "parties": ["Party 1 name", "Party 2 name"],
  "docType": "e.g. Employment Agreement, NDA, Lease, etc."
}

Provide at least 3 risks, all key dates, and 4-8 important clauses.

DOCUMENT:
${text.slice(0, 12000)}`;

  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error: ${err}`);
  }

  const data = await response.json();
  const raw = data.candidates[0].content.parts[0].text.trim();
  const clean = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  return JSON.parse(clean);
}

router.post('/', authMiddleware, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    let options = [];
    try { options = JSON.parse(req.body.options || '[]'); } catch {}

    const text = await extractText(req.file);
    if (!text || text.trim().length < 50) {
      return res.status(400).json({ error: 'Document appears to be empty or unreadable' });
    }

    const analysis = await analyzeWithGemini(text, options);

   // analysis saved in-memory only on Vercel
    res.json({ success: true, ...analysis });
  } catch (err) {
    console.error('Analysis error:', err.message);
    res.status(500).json({ error: 'Analysis failed. Please try again.' });
  }
});

module.exports = router;