// mockBackend.js
// This intercepts fetch calls for the GitHub Pages static simulation

export function initMockBackend() {
  const originalFetch = window.fetch;
  
  // Initialize mock DB in localStorage
  if (!localStorage.getItem('pos_db')) {
    localStorage.setItem('pos_db', JSON.stringify({
      staff: [{ id: 1, name: 'Admin', role: 'admin', pin: '1234' }],
      tables: [{ id: 1, name: 'T1', status: 'available' }],
      categories: [{ id: 1, name: 'Main Course' }],
      menu: [{ id: 1, category_id: 1, name: 'Mock Item', price: 100 }],
      orders: [],
      orderItems: []
    }));
  }

  const getDb = () => JSON.parse(localStorage.getItem('pos_db'));
  const setDb = (db) => localStorage.setItem('pos_db', JSON.stringify(db));
  let idCounter = Date.now();

  window.fetch = async (url, options = {}) => {
    // Only intercept /api/ calls
    if (!url.includes('/api/')) return originalFetch(url, options);
    
    const db = getDb();
    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body) : null;
    
    const response = (data, status = 200) => {
      return Promise.resolve({
        ok: status >= 200 && status < 300,
        status,
        json: () => Promise.resolve(data)
      });
    };

    // --- STAFF ---
    if (url.includes('/api/staff')) {
      if (method === 'GET') return response(db.staff);
      if (method === 'POST') {
        const newUser = { id: idCounter++, ...body };
        db.staff.push(newUser);
        setDb(db);
        return response(newUser);
      }
      if (method === 'DELETE') {
        const id = parseInt(url.split('/').pop());
        db.staff = db.staff.filter(s => s.id !== id);
        setDb(db);
        return response({ success: true });
      }
    }
    
    if (url.includes('/api/login')) {
      const user = db.staff.find(s => s.pin === body.pin);
      if (user) return response({ user });
      return response({ error: 'Invalid PIN' }, 401);
    } // --- TABLES ---
    else if (url.includes('/api/tables')) {
      if (method === 'GET') return response(db.tables);
      if (method === 'POST') {
        const newTable = { id: idCounter++, name: body.name, status: 'available' };
        db.tables.push(newTable);
        setDb(db);
        return response(newTable);
      }
      if (method === 'DELETE') {
        const id = parseInt(url.split('/').pop());
        db.tables = db.tables.filter(t => t.id !== id);
        setDb(db);
        return response({ success: true });
      }
    } // --- CATEGORIES & MENU ---
    else if (url.includes('/api/categories')) {
      if (method === 'GET') return response(db.categories);
      if (method === 'POST') {
        const newCat = { id: idCounter++, name: body.name };
        db.categories.push(newCat);
        setDb(db);
        return response(newCat);
      }
    } 
    else if (url.includes('/api/menu')) {
      if (method === 'GET') {
        const menuWithCats = db.menu.map(m => {
          const cat = db.categories.find(c => c.id == m.category_id);
          return { ...m, category_name: cat ? cat.name : 'Unknown' };
        });
        return response(menuWithCats);
      }
      if (method === 'POST') {
        const newItem = { id: idCounter++, ...body };
        db.menu.push(newItem);
        setDb(db);
        return response(newItem);
      }
    } // --- ORDERS & KOT ---
    else if (url.includes('/api/orders/running')) {
      return response(db.orders.filter(o => o.status === 'running'));
    }
    else if (url.includes('/api/orders') && !url.includes('/items') && !url.includes('/checkout')) {
      if (method === 'POST') {
        const newOrder = { id: idCounter++, table_id: body.table_id, type: body.type, status: 'running', total: 0, created_at: new Date().toISOString() };
        db.orders.push(newOrder);
        if (body.table_id) {
          const t = db.tables.find(t => t.id === body.table_id);
          if (t) t.status = 'occupied';
        }
        setDb(db);
        return response(newOrder);
      }
    }
    else if (url.includes('/items') && method === 'POST') {
      const orderId = parseInt(url.split('/api/orders/')[1].split('/')[0]);
      let addedTotal = 0;
      body.items.forEach(item => {
        db.orderItems.push({
          id: idCounter++,
          order_id: orderId,
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          price: item.price,
          notes: item.notes,
          status: 'pending'
        });
        addedTotal += (item.price * item.quantity);
      });
      const o = db.orders.find(o => o.id === orderId);
      if (o) o.total += addedTotal;
      setDb(db);
      return response({ success: true, addedTotal });
    }
    else if (url.includes('/checkout') && method === 'POST') {
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
      return response({ success: true });
    }
    else if (url.includes('/api/kot')) {
      if (method === 'GET') {
        // Build KDS View
        const pendingItems = db.orderItems.filter(oi => oi.status === 'pending' || oi.status === 'preparing');
        const kds = pendingItems.map(oi => {
           const o = db.orders.find(x => x.id === oi.order_id);
           const m = db.menu.find(x => x.id === oi.menu_item_id);
           const t = o && o.table_id ? db.tables.find(x => x.id === o.table_id) : null;
           return {
             ...oi,
             item_name: m ? m.name : 'Unknown',
             table_id: o ? o.table_id : null,
             table_name: t ? t.name : '',
             order_type: o ? o.type : 'Unknown',
             created_at: o ? o.created_at : new Date().toISOString()
           };
        });
        return response(kds);
      }
    }
    else if (url.includes('/status') && method === 'PATCH') {
       const id = parseInt(url.split('/api/kot/')[1].split('/')[0]);
       const item = db.orderItems.find(oi => oi.id === id);
       if (item) item.status = body.status;
       setDb(db);
       return response({ success: true });
    }

    return response({ error: 'Not Found in Mock DB' }, 404);
  };
}
