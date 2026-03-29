const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'pos.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Could not connect to database', err);
    } else {
        console.log('Connected to SQLite database');
    }
});

// Initialize Schema
db.serialize(() => {
    // Staff Table
    db.run(`CREATE TABLE IF NOT EXISTS staff (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT NOT NULL, -- admin, cashier, kitchen, waiter
        pin TEXT NOT NULL
    )`);

    // Tables Table
    db.run(`CREATE TABLE IF NOT EXISTS tables (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        status TEXT DEFAULT 'available' -- available, occupied
    )`);

    // Categories Table
    db.run(`CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
    )`);

    // Menu Items Table
    db.run(`CREATE TABLE IF NOT EXISTS menu_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY(category_id) REFERENCES categories(id)
    )`);

    // Orders Table
    db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_id INTEGER, -- NULL if parcel
        type TEXT NOT NULL, -- dine-in, parcel, swiggy, zomato
        status TEXT DEFAULT 'running', -- running, completed, paid, cancelled
        total REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Order Items (KOTs)
    db.run(`CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER,
        menu_item_id INTEGER,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        status TEXT DEFAULT 'pending', -- pending, preparing, ready, served
        notes TEXT,
        FOREIGN KEY(order_id) REFERENCES orders(id),
        FOREIGN KEY(menu_item_id) REFERENCES menu_items(id)
    )`);

    // Seed initial admin if empty
    db.get('SELECT COUNT(*) as count FROM staff', (err, row) => {
        if (!err && row.count === 0) {
            db.run('INSERT INTO staff (name, role, pin) VALUES (?, ?, ?)', ['Admin', 'admin', '1234']);
            console.log('Seeded default admin user with PIN: 1234');
        }
    });
});

module.exports = db;
