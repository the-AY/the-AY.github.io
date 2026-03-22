require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth.routes');
const appRoutes = require('./routes/app.routes');
const schemaRoutes = require('./routes/schema.routes');
const dataRoutes = require('./routes/data.routes');
const uiRoutes = require('./routes/ui.routes');
const moduleRoutes = require('./routes/module.routes');
const posRoutes = require('./routes/modules/pos.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// ---- Middleware ----
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ---- Routes ----
app.use('/api/auth', authRoutes);
app.use('/api/apps', appRoutes);
app.use('/api/apps', schemaRoutes);
app.use('/api/apps', dataRoutes);
app.use('/api/apps', uiRoutes);
app.use('/api/apps', moduleRoutes);
app.use('/api/apps', posRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// ---- Start ----
app.listen(PORT, () => {
  console.log(`🚀 NoCode API running on http://localhost:${PORT}`);
});

module.exports = app;
