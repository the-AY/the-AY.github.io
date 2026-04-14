const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');
const os      = require('os');
const db      = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// ── Serve the built React app to ALL devices on the WiFi ──
const distPath = path.join(__dirname, '../client/dist-electron');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  console.log('Serving frontend from dist-electron/');
} else {
  const fallback = path.join(__dirname, '../client/dist');
  if (fs.existsSync(fallback)) {
    app.use(express.static(fallback));
    console.log('Serving frontend from dist/');
  }
}

// ── Utility ────────────────────────────────────────────────
function getLocalIP() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return '127.0.0.1';
}

// ────────────────────────────────────────────────────────────
//  NETWORK INFO
// ────────────────────────────────────────────────────────────
app.get('/api/network-info', (req, res) => {
  res.json({ ip: getLocalIP(), port: process.env.PORT || 5000 });
});

// ────────────────────────────────────────────────────────────
//  SETTINGS
// ────────────────────────────────────────────────────────────
app.get('/api/settings', (req, res) => {
  db.get('SELECT * FROM settings WHERE id = 1', (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) {
      db.run(`INSERT INTO settings (id) VALUES (1)`, () => {
        db.get('SELECT * FROM settings WHERE id = 1', (e, r) => res.json(r || {}));
      });
    } else {
      res.json(row);
    }
  });
});

app.patch('/api/settings', (req, res) => {
  const { restaurant_name, address, fssai, gst_percent, currency, cgst_sgst_split } = req.body;
  db.run(`UPDATE settings SET
    restaurant_name = COALESCE(?, restaurant_name),
    address         = COALESCE(?, address),
    fssai           = COALESCE(?, fssai),
    gst_percent     = COALESCE(?, gst_percent),
    currency        = COALESCE(?, currency),
    cgst_sgst_split = COALESCE(?, cgst_sgst_split)
    WHERE id = 1`,
    [restaurant_name, address, fssai, gst_percent, currency, cgst_sgst_split],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      db.get('SELECT * FROM settings WHERE id = 1', (e, row) => res.json(row));
    }
  );
});

// ────────────────────────────────────────────────────────────
//  SESSIONS
// ────────────────────────────────────────────────────────────
app.get('/api/sessions', (req, res) => {
  db.all(
    `SELECT * FROM sessions
     WHERE datetime(last_ping) > datetime('now', '-5 minutes')
     ORDER BY login_time DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.post('/api/sessions', (req, res) => {
  const { staff_id, staff_name, role, device } = req.body;
  db.run(
    `INSERT INTO sessions (staff_id, staff_name, role, device) VALUES (?, ?, ?, ?)`,
    [staff_id, staff_name, role, device],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

app.post('/api/sessions/:id/ping', (req, res) => {
  const { id } = req.params;
  db.get('SELECT id FROM sessions WHERE id = ?', [id], (err, row) => {
    if (err || !row) return res.status(404).json({ error: 'Session expired' });
    db.run(`UPDATE sessions SET last_ping = datetime('now') WHERE id = ?`, [id], () => {
      res.json({ ok: true });
    });
  });
});

app.delete('/api/sessions/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM sessions WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ────────────────────────────────────────────────────────────
//  STAFF
// ────────────────────────────────────────────────────────────
app.get('/api/staff', (req, res) => {
  db.all('SELECT id, name, role FROM staff', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
app.post('/api/staff', (req, res) => {
  const { name, role, pin } = req.body;
  db.run('INSERT INTO staff (name, role, pin) VALUES (?, ?, ?)', [name, role, pin], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, name, role });
  });
});
app.delete('/api/staff/:id', (req, res) => {
  db.run('DELETE FROM staff WHERE id = ?', [req.params.id], function (err) {
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

// ────────────────────────────────────────────────────────────
//  TABLES
// ────────────────────────────────────────────────────────────
app.get('/api/tables', (req, res) => {
  db.all('SELECT * FROM tables ORDER BY section, name', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
app.post('/api/tables', (req, res) => {
  const { name, seats = 4, section = 'Main Hall' } = req.body;
  db.run(
    `INSERT INTO tables (name, status, seats, section) VALUES (?, 'available', ?, ?)`,
    [name, seats, section],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, name, status: 'available', seats, section });
    }
  );
});
app.delete('/api/tables/:id', (req, res) => {
  db.run('DELETE FROM tables WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ────────────────────────────────────────────────────────────
//  CATEGORIES & MENU
// ────────────────────────────────────────────────────────────
app.get('/api/categories', (req, res) => {
  db.all('SELECT * FROM categories', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
app.post('/api/categories', (req, res) => {
  db.run('INSERT INTO categories (name) VALUES (?)', [req.body.name], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, name: req.body.name });
  });
});

app.get('/api/menu', (req, res) => {
  db.all(`
    SELECT m.id, m.name, m.price, m.image_url, m.is_veg,
           c.name AS category_name, c.id AS category_id
    FROM menu_items m
    LEFT JOIN categories c ON m.category_id = c.id
    ORDER BY c.name, m.name
  `, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
app.post('/api/menu', (req, res) => {
  const { name, price, category_id, image_url = null, is_veg = 1 } = req.body;
  db.run(
    'INSERT INTO menu_items (name, price, category_id, image_url, is_veg) VALUES (?, ?, ?, ?, ?)',
    [name, price, category_id, image_url, is_veg],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, name, price, category_id, image_url, is_veg });
    }
  );
});
app.delete('/api/menu/:id', (req, res) => {
  db.run('DELETE FROM menu_items WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ────────────────────────────────────────────────────────────
//  ORDERS & KOT
// ────────────────────────────────────────────────────────────
app.get('/api/orders/running', (req, res) => {
  db.all("SELECT * FROM orders WHERE status = 'running'", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/orders', (req, res) => {
  const { table_id, type } = req.body;
  db.run(
    "INSERT INTO orders (table_id, type, status, total) VALUES (?, ?, 'running', 0)",
    [table_id, type],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (table_id) db.run("UPDATE tables SET status = 'occupied' WHERE id = ?", [table_id]);
      res.json({ id: this.lastID, table_id, type, status: 'running', total: 0 });
    }
  );
});

app.get('/api/orders/:id/items', (req, res) => {
  db.all(`
    SELECT oi.*, m.name, m.image_url, m.is_veg
    FROM order_items oi
    JOIN menu_items m ON oi.menu_item_id = m.id
    WHERE oi.order_id = ?
  `, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/orders/:id/items', (req, res) => {
  const { id } = req.params;
  const { items } = req.body;
  const stmt = db.prepare(
    "INSERT INTO order_items (order_id, menu_item_id, quantity, price, notes, status) VALUES (?, ?, ?, ?, ?, 'pending')"
  );
  let addedTotal = 0;
  items.forEach(item => {
    stmt.run([id, item.menu_item_id, item.quantity, item.price, item.notes || '']);
    addedTotal += item.quantity * item.price;
  });
  stmt.finalize();
  db.run('UPDATE orders SET total = total + ? WHERE id = ?', [addedTotal, id], err => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, addedTotal });
  });
});

app.get('/api/kot', (req, res) => {
  db.all(`
    SELECT oi.id, oi.order_id, oi.quantity, oi.notes, oi.status,
           m.name AS item_name, o.table_id, t.name AS table_name,
           o.type AS order_type, o.created_at
    FROM order_items oi
    JOIN menu_items m ON oi.menu_item_id = m.id
    JOIN orders o ON oi.order_id = o.id
    LEFT JOIN tables t ON o.table_id = t.id
    WHERE oi.status IN ('pending', 'preparing')
    ORDER BY o.created_at ASC
  `, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.patch('/api/kot/:id/status', (req, res) => {
  const { status } = req.body;
  db.run('UPDATE order_items SET status = ? WHERE id = ?', [status, req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, status });
  });
});

app.post('/api/orders/:id/checkout', (req, res) => {
  const { id } = req.params;
  db.get('SELECT table_id, total FROM orders WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    db.run("UPDATE orders SET status = 'paid' WHERE id = ?", [id]);
    if (row && row.table_id) {
      db.run("UPDATE tables SET status = 'available' WHERE id = ?", [row.table_id]);
    }
    res.json({ success: true, total: row ? row.total : 0 });
  });
});

// ── SPA fallback — must come LAST ─────────────────────────
app.get('*', (req, res) => {
  const idx = path.join(distPath, 'index.html');
  if (fs.existsSync(idx)) {
    res.sendFile(idx);
  } else {
    res.status(404).send('Frontend not built. Run: npm run build:electron');
  }
});

// ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIP();
  console.log('\n╔═══════════════════════════════════════╗');
  console.log('║       Smart Hotel POS  – Running      ║');
  console.log('╠═══════════════════════════════════════╣');
  console.log(`║  Admin (this PC):  http://localhost:${PORT} ║`);
  console.log(`║  WiFi devices:     http://${ip}:${PORT}  ║`);
  console.log('╚═══════════════════════════════════════╝\n');
});
