const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../../config/db');
const authMiddleware = require('../../middleware/auth');
const tenantMiddleware = require('../../middleware/tenant');

const router = express.Router();
router.use(authMiddleware, tenantMiddleware);

// Helper: ensure POS tables exist in tenant schema
async function ensurePOSTables(schema) {
  await db.raw(`
    CREATE TABLE IF NOT EXISTS "${schema}"."products" (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      app_id UUID NOT NULL,
      name VARCHAR(255) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      category VARCHAR(100),
      sku VARCHAR(50),
      stock INTEGER DEFAULT 0,
      image_url TEXT,
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await db.raw(`
    CREATE TABLE IF NOT EXISTS "${schema}"."orders" (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      app_id UUID NOT NULL,
      order_no SERIAL,
      items JSONB NOT NULL,
      subtotal DECIMAL(10,2) NOT NULL,
      tax DECIMAL(10,2) DEFAULT 0,
      total DECIMAL(10,2) NOT NULL,
      status VARCHAR(30) DEFAULT 'pending',
      payment JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

// GET /api/apps/:appId/pos/products
router.get('/:appId/pos/products', async (req, res, next) => {
  try {
    await ensurePOSTables(req.tenantSchema);
    const products = await db(`${req.tenantSchema}.products`).where({ app_id: req.params.appId }).orderBy('created_at', 'desc');
    res.json({ products });
  } catch (err) { next(err); }
});

// POST /api/apps/:appId/pos/products
router.post('/:appId/pos/products', async (req, res, next) => {
  try {
    await ensurePOSTables(req.tenantSchema);
    const { name, price, category, sku, stock, image_url } = req.body;
    if (!name || price === undefined) return res.status(400).json({ error: 'name and price required' });

    const product = {
      id: uuidv4(),
      app_id: req.params.appId,
      name,
      price: parseFloat(price),
      category: category || null,
      sku: sku || null,
      stock: stock || 0,
      image_url: image_url || null,
    };
    await db(`${req.tenantSchema}.products`).insert(product);
    res.status(201).json({ product });
  } catch (err) { next(err); }
});

// PATCH /api/apps/:appId/pos/products/:id
router.patch('/:appId/pos/products/:id', async (req, res, next) => {
  try {
    const updates = {};
    ['name', 'price', 'category', 'sku', 'stock', 'image_url', 'active'].forEach(k => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });
    const [product] = await db(`${req.tenantSchema}.products`).where({ id: req.params.id }).update(updates).returning('*');
    res.json({ product });
  } catch (err) { next(err); }
});

// DELETE /api/apps/:appId/pos/products/:id
router.delete('/:appId/pos/products/:id', async (req, res, next) => {
  try {
    await db(`${req.tenantSchema}.products`).where({ id: req.params.id }).del();
    res.json({ message: 'Product deleted' });
  } catch (err) { next(err); }
});

// POST /api/apps/:appId/pos/orders
router.post('/:appId/pos/orders', async (req, res, next) => {
  try {
    await ensurePOSTables(req.tenantSchema);
    const { items, subtotal, tax, total } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items array required' });
    }

    const order = {
      id: uuidv4(),
      app_id: req.params.appId,
      items: JSON.stringify(items),
      subtotal: parseFloat(subtotal),
      tax: parseFloat(tax || 0),
      total: parseFloat(total),
      status: 'pending',
      payment: JSON.stringify({}),
    };
    await db(`${req.tenantSchema}.orders`).insert(order);
    res.status(201).json({ order: { ...order, items, payment: {} } });
  } catch (err) { next(err); }
});

// GET /api/apps/:appId/pos/orders
router.get('/:appId/pos/orders', async (req, res, next) => {
  try {
    await ensurePOSTables(req.tenantSchema);
    const orders = await db(`${req.tenantSchema}.orders`).where({ app_id: req.params.appId }).orderBy('created_at', 'desc');
    const parsed = orders.map(o => ({
      ...o,
      items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items,
      payment: typeof o.payment === 'string' ? JSON.parse(o.payment) : o.payment,
    }));
    res.json({ orders: parsed });
  } catch (err) { next(err); }
});

// GET /api/apps/:appId/pos/orders/:id
router.get('/:appId/pos/orders/:id', async (req, res, next) => {
  try {
    const order = await db(`${req.tenantSchema}.orders`).where({ id: req.params.id }).first();
    if (!order) return res.status(404).json({ error: 'Order not found' });
    order.items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    res.json({ order });
  } catch (err) { next(err); }
});

// PATCH /api/apps/:appId/pos/orders/:id/status
router.patch('/:appId/pos/orders/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['pending', 'paid', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    await db(`${req.tenantSchema}.orders`).where({ id: req.params.id }).update({ status });
    res.json({ message: 'Status updated' });
  } catch (err) { next(err); }
});

// GET /api/apps/:appId/pos/stats
router.get('/:appId/pos/stats', async (req, res, next) => {
  try {
    await ensurePOSTables(req.tenantSchema);
    const appId = req.params.appId;

    // Total orders
    const [{ count: totalOrders }] = await db(`${req.tenantSchema}.orders`).where({ app_id: appId }).count('* as count');

    // Total revenue
    const [{ sum: totalRevenue }] = await db(`${req.tenantSchema}.orders`).where({ app_id: appId, status: 'paid' }).sum('total as sum');

    // Today's sales
    const today = new Date().toISOString().split('T')[0];
    const [{ sum: todaySales }] = await db(`${req.tenantSchema}.orders`)
      .where({ app_id: appId })
      .whereRaw(`DATE(created_at) = ?`, [today])
      .sum('total as sum');

    res.json({
      totalOrders: parseInt(totalOrders) || 0,
      totalRevenue: parseFloat(totalRevenue) || 0,
      todaySales: parseFloat(todaySales) || 0,
    });
  } catch (err) { next(err); }
});

// POST /api/apps/:appId/pos/orders/:id/payment
router.post('/:appId/pos/orders/:id/payment', async (req, res, next) => {
  try {
    const { method, reference } = req.body;
    await db(`${req.tenantSchema}.orders`).where({ id: req.params.id }).update({
      payment: JSON.stringify({ method, reference, paidAt: new Date().toISOString() }),
      status: 'paid',
    });
    res.json({ message: 'Payment recorded' });
  } catch (err) { next(err); }
});

module.exports = router;
