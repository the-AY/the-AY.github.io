const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'nocode-dev-secret-change-in-prod';
const JWT_EXPIRES = '7d';

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    // Check if user exists
    const existing = await db('users').where({ email }).first();
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    // Create tenant
    const tenantId = uuidv4();
    const slug = name?.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 50) || `tenant-${Date.now()}`;
    await db('tenants').insert({ id: tenantId, name: name || email.split('@')[0], slug });

    // Create user
    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 12);
    await db('users').insert({ id: userId, tenant_id: tenantId, email, password: hashedPassword, role: 'owner' });

    // Create tenant schema
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    await db.raw(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);

    const token = jwt.sign({ id: userId, tenantId, email, role: 'owner' }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.status(201).json({ token, user: { id: userId, tenantId, email, role: 'owner' } });
  } catch (err) { next(err); }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await db('users').where({ email }).first();
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, tenantId: user.tenant_id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );
    res.json({ token, user: { id: user.id, tenantId: user.tenant_id, email: user.email, role: user.role } });
  } catch (err) { next(err); }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await db('users').where({ id: req.user.id }).select('id', 'tenant_id', 'email', 'role', 'created_at').first();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) { next(err); }
});

module.exports = router;
