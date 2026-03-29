const express = require('express');
const cors = require('cors');
const db = require('./db');
const os = require('os');

const app = express();
app.use(cors());
app.use(express.json());

// Utility Function to get Local IP for other devices
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

// ---------------------------
// STAFF (Admin, Cashier, Waiter, Kitchen)
// ---------------------------
app.get('/api/staff', (req, res) => {
    db.all('SELECT id, name, role FROM staff', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});
app.post('/api/staff', (req, res) => {
    const { name, role, pin } = req.body;
    db.run('INSERT INTO staff (name, role, pin) VALUES (?, ?, ?)', [name, role, pin], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, name, role });
    });
});
app.delete('/api/staff/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM staff WHERE id = ?', [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.post('/api/login', (req, res) => {
    const { pin } = req.body;
    db.get('SELECT id, name, role FROM staff WHERE pin = ?', [pin], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(401).json({ error: 'Invalid PIN' });
        res.json({ user: row });
    });
});

// ---------------------------
// TABLES (Dynamic assignment)
// ---------------------------
app.get('/api/tables', (req, res) => {
    db.all('SELECT * FROM tables', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});
app.post('/api/tables', (req, res) => {
    const { name } = req.body;
    db.run("INSERT INTO tables (name, status) VALUES (?, 'available')", [name], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, name: name, status: 'available' });
    });
});
app.delete('/api/tables/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM tables WHERE id = ?', [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// ---------------------------
// MENU ITEMS & CATEGORIES
// ---------------------------
app.get('/api/menu', (req, res) => {
    db.all(`
        SELECT m.id, m.name, m.price, c.name as category_name, c.id as category_id
        FROM menu_items m
        LEFT JOIN categories c ON m.category_id = c.id
    `, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});
app.post('/api/menu', (req, res) => {
    const { name, price, category_id } = req.body;
    // Create 'Uncategorized' if no category provided but you should really provide one
    db.run('INSERT INTO menu_items (name, price, category_id) VALUES (?, ?, ?)', [name, price, category_id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, name, price, category_id });
    });
});

app.post('/api/categories', (req, res) => {
    const { name } = req.body;
    db.run('INSERT INTO categories (name) VALUES (?)', [name], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, name });
    });
});
app.get('/api/categories', (req, res) => {
    db.all('SELECT * FROM categories', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// ---------------------------
// ORDERS & KOT
// ---------------------------
app.get('/api/orders/running', (req, res) => {
    db.all("SELECT * FROM orders WHERE status = 'running'", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/orders', (req, res) => {
    // type: dine-in, swiggy, zomato, parcel
    const { table_id, type } = req.body;
    db.run("INSERT INTO orders (table_id, type, status, total) VALUES (?, ?, 'running', 0)", 
        [table_id, type], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (table_id) {
                db.run("UPDATE tables SET status = 'occupied' WHERE id = ?", [table_id]);
            }
            res.json({ id: this.lastID, table_id, type, status: 'running', total: 0 });
    });
});

app.post('/api/orders/:id/items', (req, res) => {
    const { id } = req.params;
    const { items } = req.body; // array of {menu_item_id, quantity, price, notes}
    
    // Add items (KOTs)
    let stmt = db.prepare("INSERT INTO order_items (order_id, menu_item_id, quantity, price, notes, status) VALUES (?, ?, ?, ?, ?, 'pending')");
    let addedTotal = 0;
    
    items.forEach(item => {
        stmt.run([id, item.menu_item_id, item.quantity, item.price, item.notes]);
        addedTotal += (item.quantity * item.price);
    });
    stmt.finalize();

    // Update total
    db.run("UPDATE orders SET total = total + ? WHERE id = ?", [addedTotal, id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, addedTotal });
    });
});

app.get('/api/kot', (req, res) => {
    // Fetch pending kitchen orders (KDS)
    db.all(`
        SELECT oi.id, oi.order_id, oi.quantity, oi.notes, oi.status, 
               m.name as item_name, o.table_id, t.name as table_name, o.type as order_type,
               o.created_at
        FROM order_items oi
        JOIN menu_items m ON oi.menu_item_id = m.id
        JOIN orders o ON oi.order_id = o.id
        LEFT JOIN tables t ON o.table_id = t.id
        WHERE oi.status = 'pending' OR oi.status = 'preparing'
        ORDER BY o.created_at ASC
    `, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.patch('/api/kot/:id/status', (req, res) => {
    // Bump order item status (pending -> preparing -> ready -> served)
    const { id } = req.params;
    const { status } = req.body; 
    db.run("UPDATE order_items SET status = ? WHERE id = ?", [status, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, status });
    });
});

app.post('/api/orders/:id/checkout', (req, res) => {
    const { id } = req.params;
    db.get('SELECT table_id FROM orders WHERE id = ?', [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        
        db.run("UPDATE orders SET status = 'paid' WHERE id = ?", [id]);
        if (row && row.table_id) {
            db.run("UPDATE tables SET status = 'available' WHERE id = ?", [row.table_id]);
        }
        res.json({ success: true });
    });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    const localIp = getLocalIP();
    console.log(\`Backend API running on:\`);
    console.log(\`- Local:   http://localhost:\${PORT}\`);
    console.log(\`- Network: http://\${localIp}:\${PORT}\`);
});
