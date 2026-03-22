const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/apps/:appId/ui
router.get('/:appId/ui', async (req, res, next) => {
  try {
    const pages = await db('ui_configs').where({ app_id: req.params.appId }).orderBy('created_at', 'desc');
    const parsed = pages.map(p => ({
      ...p,
      layout: typeof p.layout === 'string' ? JSON.parse(p.layout) : p.layout,
    }));
    res.json({ pages: parsed });
  } catch (err) { next(err); }
});

// POST /api/apps/:appId/ui
router.post('/:appId/ui', async (req, res, next) => {
  try {
    const { page_name, layout } = req.body;
    if (!page_name || !layout) return res.status(400).json({ error: 'page_name and layout required' });

    // Upsert — update if page_name exists, insert otherwise
    const existing = await db('ui_configs').where({ app_id: req.params.appId, page_name }).first();
    if (existing) {
      await db('ui_configs').where({ id: existing.id }).update({
        layout: JSON.stringify(layout),
        updated_at: new Date(),
      });
      res.json({ page: { ...existing, layout } });
    } else {
      const id = uuidv4();
      await db('ui_configs').insert({
        id,
        app_id: req.params.appId,
        page_name,
        layout: JSON.stringify(layout),
      });
      res.status(201).json({ page: { id, app_id: req.params.appId, page_name, layout } });
    }
  } catch (err) { next(err); }
});

// GET /api/apps/:appId/ui/:pageId
router.get('/:appId/ui/:pageId', async (req, res, next) => {
  try {
    const page = await db('ui_configs').where({ id: req.params.pageId, app_id: req.params.appId }).first();
    if (!page) return res.status(404).json({ error: 'Page not found' });
    page.layout = typeof page.layout === 'string' ? JSON.parse(page.layout) : page.layout;
    res.json({ page });
  } catch (err) { next(err); }
});

// PUT /api/apps/:appId/ui/:pageId
router.put('/:appId/ui/:pageId', async (req, res, next) => {
  try {
    const { layout } = req.body;
    if (!layout) return res.status(400).json({ error: 'layout required' });

    await db('ui_configs').where({ id: req.params.pageId, app_id: req.params.appId }).update({
      layout: JSON.stringify(layout),
      updated_at: new Date(),
    });
    res.json({ message: 'Layout updated' });
  } catch (err) { next(err); }
});

// DELETE /api/apps/:appId/ui/:pageId
router.delete('/:appId/ui/:pageId', async (req, res, next) => {
  try {
    await db('ui_configs').where({ id: req.params.pageId, app_id: req.params.appId }).del();
    res.json({ message: 'Page deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
