const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All routes require auth
router.use(authMiddleware);

// GET /api/apps
router.get('/', async (req, res, next) => {
  try {
    const apps = await db('apps').where({ tenant_id: req.user.tenantId }).orderBy('created_at', 'desc');
    res.json({ apps });
  } catch (err) { next(err); }
});

// POST /api/apps
router.post('/', async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'App name required' });

    const app = {
      id: uuidv4(),
      tenant_id: req.user.tenantId,
      name,
      description: description || '',
      status: 'draft',
      settings: JSON.stringify({}),
    };
    await db('apps').insert(app);
    res.status(201).json({ app: { ...app, settings: {} } });
  } catch (err) { next(err); }
});

// GET /api/apps/:appId
router.get('/:appId', async (req, res, next) => {
  try {
    const app = await db('apps').where({ id: req.params.appId, tenant_id: req.user.tenantId }).first();
    if (!app) return res.status(404).json({ error: 'App not found' });
    res.json({ app });
  } catch (err) { next(err); }
});

// PATCH /api/apps/:appId
router.patch('/:appId', async (req, res, next) => {
  try {
    const { name, description, settings } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (settings) updates.settings = JSON.stringify(settings);

    await db('apps').where({ id: req.params.appId, tenant_id: req.user.tenantId }).update(updates);
    const app = await db('apps').where({ id: req.params.appId }).first();
    res.json({ app });
  } catch (err) { next(err); }
});

// DELETE /api/apps/:appId
router.delete('/:appId', async (req, res, next) => {
  try {
    const deleted = await db('apps').where({ id: req.params.appId, tenant_id: req.user.tenantId }).del();
    if (!deleted) return res.status(404).json({ error: 'App not found' });
    res.json({ message: 'App deleted' });
  } catch (err) { next(err); }
});

// POST /api/apps/:appId/publish
router.post('/:appId/publish', async (req, res, next) => {
  try {
    await db('apps').where({ id: req.params.appId, tenant_id: req.user.tenantId }).update({ status: 'published' });
    res.json({ message: 'App published' });
  } catch (err) { next(err); }
});

module.exports = router;
