// mockBackend.js
// Intercepts fetch calls for the GitHub Pages static simulation
// Supports: staff, tables, menu, categories, orders, KOT, settings, sessions, network-info

export function initMockBackend() {
  const originalFetch = window.fetch;

  // ── Seed initial DB ────────────────────────────────────
  if (!localStorage.getItem('pos_db')) {
    localStorage.setItem('pos_db', JSON.stringify({
      staff:      [{ id: 1, name: 'Admin',   role: 'admin',   pin: '1234' }],
      tables:     [
        { id: 2, name: 'T1', status: 'available', seats: 4, section: 'Main Hall' },
        { id: 3, name: 'T2', status: 'available', seats: 2, section: 'Main Hall' },
        { id: 4, name: 'T3', status: 'available', seats: 6, section: 'Main Hall' },
        { id: 5, name: 'B1', status: 'available', seats: 4, section: 'Balcony'   },
      ],
      categories: [
        { id: 1, name: 'Main Course' },
        { id: 2, name: 'Starters'    },
        { id: 3, name: 'Beverages'   },
      ],
      menu: [
        { id: 1, category_id: 1, name: 'Butter Chicken',  price: 280, image_url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=200&q=60', is_veg: 0 },
        { id: 2, category_id: 1, name: 'Paneer Masala',   price: 220, image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=200&q=60', is_veg: 1 },
        { id: 3, category_id: 1, name: 'Dal Tadka',       price: 160, image_url: null, is_veg: 1 },
        { id: 4, category_id: 2, name: 'Veg Spring Roll', price: 120, image_url: null, is_veg: 1 },
        { id: 5, category_id: 2, name: 'Chicken Tikka',   price: 250, image_url: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=200&q=60', is_veg: 0 },
        { id: 6, category_id: 3, name: 'Masala Chai',     price: 40,  image_url: null, is_veg: 1 },
        { id: 7, category_id: 3, name: 'Fresh Juice',     price: 80,  image_url: null, is_veg: 1 },
      ],
      settings: {
        id: 1,
        restaurant_name: 'Smart Hotel POS',
        address:         '123 Main St, Bangalore',
        fssai:           '',
        gst_percent:     5.0,
        currency:        '₹',
        cgst_sgst_split: 1,
      },
      sessions:   [],
      orders:     [],
      orderItems: [],
    }));
  }

  const getDb  = () => JSON.parse(localStorage.getItem('pos_db'));
  const setDb  = (db) => localStorage.setItem('pos_db', JSON.stringify(db));
  let idCounter = Date.now();

  window.fetch = async (url, options = {}) => {
    if (!url.includes('/api/')) return originalFetch(url, options);

    const db     = getDb();
    const method = options.method || 'GET';
    const body   = options.body ? JSON.parse(options.body) : null;

    const ok  = (data, status = 200) =>
      Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(data) });

    // ── Network info ─────────────────────────────────────
    if (url.includes('/api/network-info')) {
      return ok({ ip: '127.0.0.1', port: 5000 });
    }

    // ── Settings ─────────────────────────────────────────
    if (url.includes('/api/settings')) {
      if (method === 'GET')   return ok(db.settings);
      if (method === 'PATCH') {
        db.settings = { ...db.settings, ...body };
        setDb(db);
        return ok(db.settings);
      }
    }

    // ── Sessions ─────────────────────────────────────────
    if (url.includes('/sessions')) {
      if (url.includes('/ping') && method === 'POST') {
        const sid = parseInt(url.split('/sessions/')[1].split('/')[0]);
        const s   = db.sessions.find(s => s.id === sid);
        if (!s) return ok({ error: 'Session not found' }, 404);
        s.last_ping = new Date().toISOString();
        setDb(db);
        return ok({ ok: true });
      }
      if (method === 'GET')    return ok(db.sessions);
      if (method === 'POST') {
        const newS = { id: idCounter++, ...body, login_time: new Date().toISOString(), last_ping: new Date().toISOString() };
        db.sessions.push(newS);
        setDb(db);
        return ok({ id: newS.id });
      }
      if (method === 'DELETE') {
        const sid = parseInt(url.split('/sessions/')[1]);
        db.sessions = db.sessions.filter(s => s.id !== sid);
        setDb(db);
        return ok({ success: true });
      }
    }

    // ── Staff ─────────────────────────────────────────────
    if (url.includes('/api/staff') && !url.includes('/api/sessions')) {
      if (method === 'GET')    return ok(db.staff.map(({ pin: _, ...s }) => s));
      if (method === 'POST') {
        const ns = { id: idCounter++, ...body };
        db.staff.push(ns);
        setDb(db);
        return ok({ id: ns.id, name: ns.name, role: ns.role });
      }
      if (method === 'DELETE') {
        const id = parseInt(url.split('/').pop());
        db.staff = db.staff.filter(s => s.id !== id);
        setDb(db);
        return ok({ success: true });
      }
    }

    // ── Login ─────────────────────────────────────────────
    if (url.includes('/api/login')) {
      const u = db.staff.find(s => s.pin === body.pin);
      if (u) return ok({ user: { id: u.id, name: u.name, role: u.role } });
      return ok({ error: 'Invalid PIN' }, 401);
    }

    // ── Tables ────────────────────────────────────────────
    if (url.includes('/api/tables')) {
      if (method === 'GET')    return ok(db.tables);
      if (method === 'POST') {
        const nt = { id: idCounter++, status: 'available', seats: body.seats || 4, section: body.section || 'Main Hall', ...body };
        db.tables.push(nt);
        setDb(db);
        return ok(nt);
      }
      if (method === 'DELETE') {
        const id = parseInt(url.split('/').pop());
        db.tables = db.tables.filter(t => t.id !== id);
        setDb(db);
        return ok({ success: true });
      }
    }

    // ── Categories ────────────────────────────────────────
    if (url.includes('/api/categories')) {
      if (method === 'GET')    return ok(db.categories);
      if (method === 'POST') {
        const nc = { id: idCounter++, name: body.name };
        db.categories.push(nc);
        setDb(db);
        return ok(nc);
      }
    }

    // ── Menu ──────────────────────────────────────────────
    if (url.includes('/api/menu')) {
      if (method === 'GET') {
        return ok(db.menu.map(m => ({
          ...m,
          category_name: db.categories.find(c => c.id === m.category_id)?.name || 'Unknown',
        })));
      }
      if (method === 'POST') {
        const nm = { id: idCounter++, image_url: null, is_veg: 1, ...body };
        db.menu.push(nm);
        setDb(db);
        return ok(nm);
      }
      if (method === 'DELETE') {
        const id = parseInt(url.split('/').pop());
        db.menu = db.menu.filter(m => m.id !== id);
        setDb(db);
        return ok({ success: true });
      }
    }

    // ── Order Items (GET — for billing) ──────────────────
    if (url.includes('/items') && method === 'GET') {
      const orderId = parseInt(url.split('/api/orders/')[1].split('/')[0]);
      const items   = db.orderItems
        .filter(oi => oi.order_id === orderId)
        .map(oi => {
          const m = db.menu.find(x => x.id === oi.menu_item_id);
          return { ...oi, name: m?.name || 'Unknown', image_url: m?.image_url || null, is_veg: m?.is_veg ?? 1 };
        });
      return ok(items);
    }

    // ── Running orders ────────────────────────────────────
    if (url.includes('/api/orders/running')) {
      return ok(db.orders.filter(o => o.status === 'running'));
    }

    // ── Create order ──────────────────────────────────────
    if (url.includes('/api/orders') && method === 'POST' && !url.includes('/items') && !url.includes('/checkout')) {
      const no = { id: idCounter++, table_id: body.table_id, type: body.type, status: 'running', total: 0, created_at: new Date().toISOString() };
      db.orders.push(no);
      if (body.table_id) {
        const t = db.tables.find(t => t.id === body.table_id);
        if (t) t.status = 'occupied';
      }
      setDb(db);
      return ok(no);
    }

    // ── Add items to order ────────────────────────────────
    if (url.includes('/items') && method === 'POST') {
      const orderId = parseInt(url.split('/api/orders/')[1].split('/')[0]);
      let addedTotal = 0;
      body.items.forEach(item => {
        db.orderItems.push({
          id: idCounter++, order_id: orderId, menu_item_id: item.menu_item_id,
          quantity: item.quantity, price: item.price, notes: item.notes || '', status: 'pending',
        });
        addedTotal += item.price * item.quantity;
      });
      const o = db.orders.find(o => o.id === orderId);
      if (o) o.total += addedTotal;
      setDb(db);
      return ok({ success: true, addedTotal });
    }

    // ── Checkout ──────────────────────────────────────────
    if (url.includes('/checkout') && method === 'POST') {
      const orderId = parseInt(url.split('/api/orders/')[1].split('/')[0]);
      const o = db.orders.find(o => o.id === orderId);
      if (o) {
        o.status = 'paid';
        if (o.table_id) {
          const t = db.tables.find(t => t.id === o.table_id);
          if (t) t.status = 'available';
        }
      }
      setDb(db);
      return ok({ success: true });
    }

    // ── KOT (GET kitchen view) ────────────────────────────
    if (url.includes('/api/kot') && method === 'GET') {
      const pending = db.orderItems.filter(oi => oi.status === 'pending' || oi.status === 'preparing');
      return ok(pending.map(oi => {
        const o = db.orders.find(x => x.id === oi.order_id);
        const m = db.menu.find(x => x.id === oi.menu_item_id);
        const t = o?.table_id ? db.tables.find(x => x.id === o.table_id) : null;
        return { ...oi, item_name: m?.name || 'Unknown', table_name: t?.name || '', order_type: o?.type || '', created_at: o?.created_at || new Date().toISOString() };
      }));
    }

    // ── KOT status update ─────────────────────────────────
    if (url.includes('/status') && method === 'PATCH') {
      const parts   = url.split('/');
      const id      = parseInt(parts[parts.indexOf('kot') + 1]);
      const item    = db.orderItems.find(oi => oi.id === id);
      if (item) { item.status = body.status; setDb(db); return ok({ success: true }); }
      return ok({ error: 'Not found' }, 404);
    }

    return ok({ error: 'Not found in Mock DB' }, 404);
  };
}
