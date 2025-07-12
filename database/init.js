const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'search_service.db');
let db;

const init = async () => {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
        reject(err);
        return;
      }
      
      console.log('Connected to SQLite database');
      
      // Enable foreign keys
      db.run('PRAGMA foreign_keys = ON');
      
      // Create tables
      createTables()
        .then(() => {
          console.log('Database tables created successfully');
          resolve();
        })
        .catch(reject);
    });
  });
};

const createTables = async () => {
  const tables = [
    `CREATE TABLE IF NOT EXISTS search_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query TEXT NOT NULL,
      results_count INTEGER DEFAULT 0,
      search_engine TEXT DEFAULT 'google',
      user_ip TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS search_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      search_id INTEGER,
      title TEXT,
      url TEXT,
      snippet TEXT,
      rank INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (search_id) REFERENCES search_history (id) ON DELETE CASCADE
    )`,
    
    `CREATE TABLE IF NOT EXISTS user_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_ip TEXT UNIQUE,
      default_search_engine TEXT DEFAULT 'default',
      results_per_page INTEGER DEFAULT 10,
      safe_search BOOLEAN DEFAULT 1,
      use_puppeteer BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  ];
  
  return new Promise((resolve, reject) => {
    let completed = 0;
    const total = tables.length;
    
    tables.forEach((table) => {
      db.run(table, (err) => {
        if (err) {
          console.error('Error creating table:', err.message);
          reject(err);
          return;
        }
        
        completed++;
        if (completed === total) {
          resolve();
        }
      });
    });
  });
};

const getDb = () => {
  if (!db) {
    throw new Error('Database not initialized. Call init() first.');
  }
  return db;
};

const close = () => {
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed');
      }
    });
  }
};

module.exports = {
  init,
  getDb,
  close
}; 