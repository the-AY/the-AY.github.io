const db = require('../config/db');

/**
 * Tenant isolation middleware.
 * Sets PostgreSQL search_path to the tenant's schema.
 * Must run AFTER auth middleware.
 */
async function tenantMiddleware(req, res, next) {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    return res.status(403).json({ error: 'Tenant context required' });
  }

  const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
  req.tenantSchema = schemaName;

  try {
    // Ensure schema exists
    await db.raw(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
    next();
  } catch (err) {
    console.error('Tenant middleware error:', err);
    next(err);
  }
}

module.exports = tenantMiddleware;
