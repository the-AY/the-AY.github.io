const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenant');

const router = express.Router();

// Column name validation
const VALID_NAME = /^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/;
const TYPE_MAP = {
  TEXT: 'TEXT',
  INTEGER: 'INTEGER',
  DECIMAL: 'DECIMAL(10,2)',
  BOOLEAN: 'BOOLEAN',
  DATE: 'DATE',
  TIMESTAMP: 'TIMESTAMPTZ',
  JSONB: 'JSONB',
};

router.use(authMiddleware, tenantMiddleware);

// GET /api/apps/:appId/tables
router.get('/:appId/tables', async (req, res, next) => {
  try {
    const tables = await db('table_schemas').where({ app_id: req.params.appId }).orderBy('created_at', 'desc');
    // Parse fields JSONB
    const parsed = tables.map(t => ({ ...t, fields: typeof t.fields === 'string' ? JSON.parse(t.fields) : t.fields }));
    res.json({ tables: parsed });
  } catch (err) { next(err); }
});

// POST /api/apps/:appId/tables
router.post('/:appId/tables', async (req, res, next) => {
  try {
    const { table_name, fields } = req.body;
    if (!table_name || !VALID_NAME.test(table_name)) {
      return res.status(400).json({ error: 'Invalid table name. Use lowercase letters, numbers, and underscores.' });
    }
    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      return res.status(400).json({ error: 'At least one field is required' });
    }

    // Validate field names & types
    for (const f of fields) {
      if (!VALID_NAME.test(f.name)) return res.status(400).json({ error: `Invalid field name: ${f.name}` });
      if (!TYPE_MAP[f.type]) return res.status(400).json({ error: `Invalid field type: ${f.type}` });
    }

    // Build CREATE TABLE DDL
    const schema = req.tenantSchema;
    const cols = fields.map(f => {
      let col = `"${f.name}" ${TYPE_MAP[f.type]}`;
      if (f.required) col += ' NOT NULL';
      if (f.defaultValue !== undefined && f.defaultValue !== null) col += ` DEFAULT '${f.defaultValue}'`;
      return col;
    }).join(', ');

    const ddl = `CREATE TABLE IF NOT EXISTS "${schema}"."${table_name}" (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ${cols},
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`;

    await db.raw(ddl);

    // Store schema definition
    const tableId = uuidv4();
    await db('table_schemas').insert({
      id: tableId,
      app_id: req.params.appId,
      table_name,
      fields: JSON.stringify(fields),
    });

    res.status(201).json({ table: { id: tableId, app_id: req.params.appId, table_name, fields } });
  } catch (err) { next(err); }
});

// GET /api/apps/:appId/tables/:tableId
router.get('/:appId/tables/:tableId', async (req, res, next) => {
  try {
    const table = await db('table_schemas').where({ id: req.params.tableId, app_id: req.params.appId }).first();
    if (!table) return res.status(404).json({ error: 'Table not found' });
    table.fields = typeof table.fields === 'string' ? JSON.parse(table.fields) : table.fields;
    res.json({ table });
  } catch (err) { next(err); }
});

// PATCH /api/apps/:appId/tables/:tableId  (add fields)
router.patch('/:appId/tables/:tableId', async (req, res, next) => {
  try {
    const table = await db('table_schemas').where({ id: req.params.tableId, app_id: req.params.appId }).first();
    if (!table) return res.status(404).json({ error: 'Table not found' });

    const { addFields, removeFields } = req.body;
    const schema = req.tenantSchema;
    let fields = typeof table.fields === 'string' ? JSON.parse(table.fields) : table.fields;

    // Add new fields via ALTER TABLE
    if (addFields && Array.isArray(addFields)) {
      for (const f of addFields) {
        if (!VALID_NAME.test(f.name) || !TYPE_MAP[f.type]) continue;
        await db.raw(`ALTER TABLE "${schema}"."${table.table_name}" ADD COLUMN IF NOT EXISTS "${f.name}" ${TYPE_MAP[f.type]}`);
        fields.push(f);
      }
    }

    // Remove fields
    if (removeFields && Array.isArray(removeFields)) {
      for (const name of removeFields) {
        if (!VALID_NAME.test(name)) continue;
        await db.raw(`ALTER TABLE "${schema}"."${table.table_name}" DROP COLUMN IF EXISTS "${name}"`);
        fields = fields.filter(f => f.name !== name);
      }
    }

    await db('table_schemas').where({ id: req.params.tableId }).update({
      fields: JSON.stringify(fields),
      updated_at: new Date(),
    });

    res.json({ table: { ...table, fields } });
  } catch (err) { next(err); }
});

// DELETE /api/apps/:appId/tables/:tableId
router.delete('/:appId/tables/:tableId', async (req, res, next) => {
  try {
    const table = await db('table_schemas').where({ id: req.params.tableId, app_id: req.params.appId }).first();
    if (!table) return res.status(404).json({ error: 'Table not found' });

    const schema = req.tenantSchema;
    await db.raw(`DROP TABLE IF EXISTS "${schema}"."${table.table_name}" CASCADE`);
    await db('table_schemas').where({ id: req.params.tableId }).del();

    res.json({ message: 'Table deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
