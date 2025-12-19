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
    //const rows = db.prepare('SELECT * FROM time_entries').all();
    const stmt = db.prepare("SELECT * FROM time_entries WHERE DATE(startDate) >= ? AND DATE(startDate) <= ?");
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

