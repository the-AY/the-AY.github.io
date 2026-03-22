const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const AVAILABLE_MODULES = [
  { key: 'pos', name: 'Point of Sale', description: 'Manage products, generate bills, track orders' },
  { key: 'blog', name: 'Blog', description: 'Create and manage blog posts' },
  { key: 'inventory', name: 'Inventory', description: 'Track stock and inventory levels' },
];

// GET /api/apps/:appId/modules
router.get('/:appId/modules', async (req, res, next) => {
  try {
    const enabled = await db('app_modules').where({ app_id: req.params.appId });
    const modules = AVAILABLE_MODULES.map(m => ({
      ...m,
      enabled: enabled.some(e => e.module_key === m.key && e.enabled),
    }));
    res.json({ modules });
  } catch (err) { next(err); }
});

// POST /api/apps/:appId/modules/:moduleKey/enable
router.post('/:appId/modules/:moduleKey/enable', async (req, res, next) => {
  try {
    const { appId, moduleKey } = req.params;
    const existing = await db('app_modules').where({ app_id: appId, module_key: moduleKey }).first();
    if (existing) {
      await db('app_modules').where({ id: existing.id }).update({ enabled: true });
    } else {
      await db('app_modules').insert({ id: uuidv4(), app_id: appId, module_key: moduleKey, enabled: true, config: JSON.stringify({}) });
    }
    res.json({ message: `Module ${moduleKey} enabled` });
  } catch (err) { next(err); }
});

// POST /api/apps/:appId/modules/:moduleKey/disable
router.post('/:appId/modules/:moduleKey/disable', async (req, res, next) => {
  try {
    await db('app_modules').where({ app_id: req.params.appId, module_key: req.params.moduleKey }).update({ enabled: false });
    res.json({ message: `Module ${req.params.moduleKey} disabled` });
  } catch (err) { next(err); }
});

module.exports = router;
