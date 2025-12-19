const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/companies', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM companies').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/time-entries', (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    const stmt = db.prepare("SELECT * FROM time_entries WHERE startDate >= ? AND startDate <= ? ORDER BY endDate NULLS LAST");
    rows = stmt.all(startDate, endDate);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST route to create a time entry
app.post('/api/time-entries', (req, res) => {
  const { startDate, endDate } = req.body;
  console.log(startDate, endDate);

  if (!startDate) {
    return res.status(400).json({ error: "Missing time_in" });
  }

  try {
    const stmt = db.prepare('INSERT INTO time_entries (startDate, endDate) VALUES (?, ?)');
    const info = stmt.run(startDate, endDate);

    // Return the newly created record
    res.status(201).json({
      id: info.lastInsertRowid,
      startDate,
      endDate
    });
  } catch (err) {
    console.error("Database Error:", err.message);
    res.status(500).json({ error: "Failed to save record" });
  }
});

// PATCH route to update a time entry
app.patch('/api/time-entries/:id', (req, res) => {
  const { id } = req.params;

  const { startDate, endDate } = req.body;
  const fields = [];
  const values = [];

  if(startDate !== undefined) {
    fields.push('startDate = ?');
    values.push(startDate);
  }

  if(endDate !== "") {
    fields.push('endDate = ?');
    values.push(endDate);
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  try {
    const stmt = db.prepare(`
      UPDATE time_entries
      SET ${fields.join(', ')}
      WHERE id = ?
    `);
    const info = stmt.run(...values, id);

    const stmtFetch = db.prepare('SELECT * FROM time_entries where id = ?');
    const infoFetch = stmtFetch.run(id);

    // Return the newly updated record
    res.status(201).json({
      id: infoFetch.id,
      startDate,
      endDate
    });
  } catch (err) {
    console.error("Database Error:", err.message);
    res.status(500).json({ error: "Failed to update record" + err });
  }
});

// DELETE route to delete a time entry
app.delete('/api/time-entries', (req, res) => {
  const { id } = req.body;

  try {
    const stmt = db.prepare('DELETE FROM time_entries WHERE id = ?');
    const info = stmt.run(id);

    res.status(201).json(req.body);
  } catch (err) {
    console.error("Database Error:", err.message);
    res.status(500).json({ error: "Failed to delete record" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

