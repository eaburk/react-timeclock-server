const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// GET route to fetch list of companies
app.get('/api/companies', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM companies ORDER BY lower(description)').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST route to create a company
app.post('/api/companies', (req, res) => {
  const { description } = req.body;

  if (!description) {
    return res.status(400).json({ error: "Missing company description" });
  }

  try {
    const stmt = db.prepare('INSERT INTO companies (description) VALUES (?)');
    const info = stmt.run(description);

    // Return the newly created record
    res.status(201).json({
      id: info.lastInsertRowid,
      description,
    });
  } catch (err) {
    console.error("Database Error:", err.message);
    res.status(500).json({ error: "Failed to save company" });
  }
});

// DELETE route to delete a company
app.delete('/api/companies', (req, res) => {
  const { id } = req.body;

  try {
    const stmt = db.prepare('DELETE FROM companies WHERE id = ?');
    const info = stmt.run(id);

    res.status(201).json(req.body);
  } catch (err) {
    console.error("Database Error:", err.message);
    res.status(500).json({ error: "Failed to delete record" });
  }
});

// GET route to get list of time entries
app.get('/api/time-entries', (req, res) => {
  const { startDate, endDate, companyId } = req.query;

  try {
    const stmt = db.prepare("SELECT id, startDate, endDate, billed, COALESCE(ROUND((julianday(endDate) - julianday(startDate)) * 1440),0) AS durationMinutes FROM time_entries WHERE startDate >= ? AND startDate <= ? and companyId = ? ORDER BY endDate NULLS LAST");
    rows = stmt.all(startDate, endDate, companyId);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST route to create a time entry
app.post('/api/time-entries', (req, res) => {
  const { startDate, endDate, companyId } = req.body;

  if (!startDate) {
    return res.status(400).json({ error: "Missing time_in" });
  }

  try {
    const stmt = db.prepare( 'INSERT INTO time_entries (startDate, endDate, companyId) VALUES (?, ?, ?)');
    const info = stmt.run(startDate, endDate, companyId);

    const stmtFetch = db.prepare(`
      SELECT
        id,
        startDate,
        endDate,
        COALESCE(
          ROUND((julianday(endDate) - julianday(startDate)) * 1440),
          0
        ) AS durationMinutes
      FROM time_entries
      WHERE id = ?
    `);

    const insertedRow = stmtFetch.get(info.lastInsertRowid);
    // Return the newly created record
    res.status(201).json({
      id: insertedRow.id,
      startDate: insertedRow.startDate,
      endDate: insertedRow.endDate,
      durationMinutes: insertedRow.durationMinutes
    });
  } catch (err) {
    console.error("Database Error:", err.message);
    res.status(500).json({ error: "Failed to save record" });
  }
});

// PATCH route to update a time entry
app.patch('/api/time-entries/:id', (req, res) => {
  const { id } = req.params;

  const { startDate, endDate, billed } = req.body;
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

  if(billed) {
    fields.push('billed = ?');
    values.push(billed);
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

    const stmtFetch = db.prepare(`
      SELECT
        id,
        startDate,
        endDate,
        COALESCE(
          ROUND((julianday(endDate) - julianday(startDate)) * 1440),
          0
        ) AS durationMinutes
      FROM time_entries
      WHERE id = ?
    `);

    const insertedRow = stmtFetch.get(id);
    // return the updated row
    res.status(201).json({
      id: id,
      startDate: insertedRow.startDate,
      endDate: insertedRow.endDate,
      durationMinutes: insertedRow.durationMinutes
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

