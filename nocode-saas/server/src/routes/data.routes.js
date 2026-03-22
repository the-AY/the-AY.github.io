const express = require('express');
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenant');

const router = express.Router();
const VALID_NAME = /^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/;

router.use(authMiddleware, tenantMiddleware);

// Helper: verify table belongs to app
async function getTableSchema(appId, tableName) {
  return db('table_schemas').where({ app_id: appId, table_name: tableName }).first();
}

// GET /api/apps/:appId/data/:tableName
router.get('/:appId/data/:tableName', async (req, res, next) => {
  try {
    const { tableName, appId } = req.params;
    if (!VALID_NAME.test(tableName)) return res.status(400).json({ error: 'Invalid table name' });

    const schema = await getTableSchema(appId, tableName);
    if (!schema) return res.status(404).json({ error: 'Table not found' });

    const { page = 1, limit = 20, sort = 'created_at', order = 'desc' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const rows = await db(`${req.tenantSchema}.${tableName}`)
      .orderBy(sort, order)
      .limit(parseInt(limit))
      .offset(offset);

    const [{ count }] = await db(`${req.tenantSchema}.${tableName}`).count('* as count');

    res.json({ rows, total: parseInt(count), page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
});

// POST /api/apps/:appId/data/:tableName
router.post('/:appId/data/:tableName', async (req, res, next) => {
  try {
    const { tableName, appId } = req.params;
    if (!VALID_NAME.test(tableName)) return res.status(400).json({ error: 'Invalid table name' });

    const schema = await getTableSchema(appId, tableName);
    if (!schema) return res.status(404).json({ error: 'Table not found' });

    // Filter body to only allowed fields
    const fields = typeof schema.fields === 'string' ? JSON.parse(schema.fields) : schema.fields;
    const allowedKeys = fields.map(f => f.name);
    const data = {};
    for (const key of allowedKeys) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }

    const [row] = await db(`${req.tenantSchema}.${tableName}`).insert(data).returning('*');
    res.status(201).json({ row });
  } catch (err) { next(err); }
});

// GET /api/apps/:appId/data/:tableName/:rowId
router.get('/:appId/data/:tableName/:rowId', async (req, res, next) => {
  try {
    const { tableName, rowId, appId } = req.params;
    if (!VALID_NAME.test(tableName)) return res.status(400).json({ error: 'Invalid table name' });

    const schema = await getTableSchema(appId, tableName);
    if (!schema) return res.status(404).json({ error: 'Table not found' });

    const row = await db(`${req.tenantSchema}.${tableName}`).where({ id: rowId }).first();
    if (!row) return res.status(404).json({ error: 'Row not found' });
    res.json({ row });
  } catch (err) { next(err); }
});

// PATCH /api/apps/:appId/data/:tableName/:rowId
router.patch('/:appId/data/:tableName/:rowId', async (req, res, next) => {
  try {
    const { tableName, rowId, appId } = req.params;
    if (!VALID_NAME.test(tableName)) return res.status(400).json({ error: 'Invalid table name' });

    const schema = await getTableSchema(appId, tableName);
    if (!schema) return res.status(404).json({ error: 'Table not found' });

    const fields = typeof schema.fields === 'string' ? JSON.parse(schema.fields) : schema.fields;
    const allowedKeys = fields.map(f => f.name);
    const data = {};
    for (const key of allowedKeys) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }
    data.updated_at = new Date();

    const [row] = await db(`${req.tenantSchema}.${tableName}`).where({ id: rowId }).update(data).returning('*');
    if (!row) return res.status(404).json({ error: 'Row not found' });
    res.json({ row });
  } catch (err) { next(err); }
});

// DELETE /api/apps/:appId/data/:tableName/:rowId
router.delete('/:appId/data/:tableName/:rowId', async (req, res, next) => {
  try {
    const { tableName, rowId, appId } = req.params;
    if (!VALID_NAME.test(tableName)) return res.status(400).json({ error: 'Invalid table name' });

    const schema = await getTableSchema(appId, tableName);
    if (!schema) return res.status(404).json({ error: 'Table not found' });

    const deleted = await db(`${req.tenantSchema}.${tableName}`).where({ id: rowId }).del();
    if (!deleted) return res.status(404).json({ error: 'Row not found' });
    res.json({ message: 'Row deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
