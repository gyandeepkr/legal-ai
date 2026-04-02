const express = require('express');
const authMiddleware = require('../middleware/auth');
const { getDb } = require('../db/database');

const router = express.Router();

// GET /documents — list all documents for the logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const result = db.exec(
      `SELECT id, filename, file_size, summary, risks, dates, clauses, created_at
       FROM documents WHERE user_id = ${req.user.id}
       ORDER BY created_at DESC`
    );

    if (!result.length) return res.json({ documents: [] });

    const [cols, ...rows] = [result[0].columns, ...result[0].values];
    const documents = result[0].values.map(row => {
      const doc = {};
      result[0].columns.forEach((col, i) => {
        doc[col] = row[i];
      });
      // Parse JSON fields
      doc.risks = JSON.parse(doc.risks || '[]');
      doc.dates = JSON.parse(doc.dates || '[]');
      doc.clauses = JSON.parse(doc.clauses || '[]');
      return doc;
    });

    res.json({ documents });
  } catch (err) {
    console.error('Documents fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// GET /documents/:id — single document
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const result = db.exec(
      `SELECT * FROM documents WHERE id = ${req.params.id} AND user_id = ${req.user.id}`
    );

    if (!result.length || !result[0].values.length) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const doc = {};
    result[0].columns.forEach((col, i) => {
      doc[col] = result[0].values[0][i];
    });
    doc.risks = JSON.parse(doc.risks || '[]');
    doc.dates = JSON.parse(doc.dates || '[]');
    doc.clauses = JSON.parse(doc.clauses || '[]');

    res.json({ document: doc });
  } catch (err) {
    console.error('Document fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// DELETE /documents/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    db.run(
      `DELETE FROM documents WHERE id = ${req.params.id} AND user_id = ${req.user.id}`
    );
    const { saveDb } = require('../db/database');
    saveDb();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

module.exports = router;
