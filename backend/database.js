const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Use the explicit Railway volume directory in production, default to local folder in dev
const dataDir = process.env.NODE_ENV === 'production' 
  ? '/app/data' 
  : path.join(__dirname, 'data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'database.sqlite');
console.log(`Database is initializing at absolute path: ${dbPath}`);

const db = new sqlite3.Database(dbPath, (err) => {
  // ... rest of your code stays exactly the same
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');

    // Create Users table
    db.run('DROP TABLE IF EXISTS users');
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      pfp TEXT DEFAULT 'default_avatar.png',
      totalScore INTEGER DEFAULT 0,
      matchesPlayed INTEGER DEFAULT 0,
      matchesWon INTEGER DEFAULT 0,
      matchesLost INTEGER DEFAULT 0
    )`);
  }
});

// Helper functions for DB queries
const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      resolve(row);
    });
  });
};

const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      resolve(this);
    });
  });
};

// Add this to your database.js file right above module.exports
const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      resolve(rows);
    });
  });
};

module.exports = {
  db,
  dbGet,
  dbRun,
  dbAll
};
