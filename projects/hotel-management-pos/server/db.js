const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const os = require('os');

// In packaged mode, store DB in a persistent user folder
const dbDir = process.env.DB_PATH
  ? path.dirname(process.env.DB_PATH)
  : path.resolve(__dirname);

if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const dbPath = process.env.DB_PATH || path.resolve(__dirname, 'pos.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('DB connect error:', err);
  else console.log('SQLite DB ready at:', dbPath);
});

db.run('PRAGMA journal_mode=WAL');
db.run('PRAGMA foreign_keys=ON');

db.serialize(() => {
  // ── Staff ──────────────────────────────────────────────
  db.run(`CREATE TABLE IF NOT EXISTS staff (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL,  -- admin | cashier | waiter | kitchen
    pin  TEXT NOT NULL
  )`);

  // ── Tables ─────────────────────────────────────────────
  db.run(`CREATE TABLE IF NOT EXISTS tables (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    name    TEXT NOT NULL,
    status  TEXT DEFAULT 'available',
    seats   INTEGER DEFAULT 4,
    section TEXT DEFAULT 'Main Hall'
  )`);

  // ── Categories ─────────────────────────────────────────
  db.run(`CREATE TABLE IF NOT EXISTS categories (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  )`);

  // ── Menu Items ─────────────────────────────────────────
  db.run(`CREATE TABLE IF NOT EXISTS menu_items (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    name        TEXT NOT NULL,
    price       REAL NOT NULL,
    image_url   TEXT,
    is_veg      INTEGER DEFAULT 1,
    FOREIGN KEY(category_id) REFERENCES categories(id)
  )`);

  // ── Orders ─────────────────────────────────────────────
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    table_id   INTEGER,
    type       TEXT NOT NULL,
    status     TEXT DEFAULT 'running',
    total      REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // ── Order Items (KOTs) ─────────────────────────────────
  db.run(`CREATE TABLE IF NOT EXISTS order_items (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id     INTEGER,
    menu_item_id INTEGER,
    quantity     INTEGER NOT NULL,
    price        REAL NOT NULL,
    status       TEXT DEFAULT 'pending',
    notes        TEXT,
    FOREIGN KEY(order_id)     REFERENCES orders(id),
    FOREIGN KEY(menu_item_id) REFERENCES menu_items(id)
  )`);

  // ── Settings (single-row) ──────────────────────────────
  db.run(`CREATE TABLE IF NOT EXISTS settings (
    id              INTEGER PRIMARY KEY DEFAULT 1,
    restaurant_name TEXT    DEFAULT 'Smart Hotel POS',
    address         TEXT    DEFAULT '',
    fssai           TEXT    DEFAULT '',
    gst_percent     REAL    DEFAULT 5.0,
    currency        TEXT    DEFAULT '₹',
    cgst_sgst_split INTEGER DEFAULT 1
  )`);

  // ── Sessions ───────────────────────────────────────────
  db.run(`CREATE TABLE IF NOT EXISTS sessions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    staff_id   INTEGER NOT NULL,
    staff_name TEXT NOT NULL,
    role       TEXT NOT NULL,
    login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_ping  DATETIME DEFAULT CURRENT_TIMESTAMP,
    device     TEXT,
    FOREIGN KEY(staff_id) REFERENCES staff(id)
  )`);

  // ── Safe migrations (ignored if column already exists) ─
  db.run(`ALTER TABLE menu_items ADD COLUMN image_url TEXT`,   () => {});
  db.run(`ALTER TABLE menu_items ADD COLUMN is_veg INTEGER DEFAULT 1`, () => {});
  db.run(`ALTER TABLE tables ADD COLUMN seats INTEGER DEFAULT 4`,       () => {});
  db.run(`ALTER TABLE tables ADD COLUMN section TEXT DEFAULT 'Main Hall'`, () => {});

  // ── Seeds ──────────────────────────────────────────────
  db.get('SELECT COUNT(*) as c FROM staff', (err, row) => {
    if (!err && row.c === 0) {
      db.run(`INSERT INTO staff (name, role, pin) VALUES ('Admin','admin','1234')`);
      console.log('Seeded default admin PIN: 1234');
    }
  });

  db.get('SELECT COUNT(*) as c FROM settings', (err, row) => {
    if (!err && row.c === 0) {
      db.run(`INSERT INTO settings (id, restaurant_name, gst_percent, currency)
              VALUES (1, 'Smart Hotel POS', 5.0, '₹')`);
    }
  });
});

module.exports = db;
