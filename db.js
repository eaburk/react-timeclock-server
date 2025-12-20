const Database = require('better-sqlite3');
const path = require('path');

// Connect to the local file (it will be created if it doesn't exist)
const db = new Database(path.join(__dirname, 'database.db'), {
  verbose: console.log // Logs all SQL queries to your terminal
});

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS time_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    statDate DATETIME,
    endDate DATETIME,
    billed BOOLEAN DEFAULT false,
    manual_entry BOOLEAN DEFAULT false,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    companyId INTEGER
  );
`);

module.exports = db;
