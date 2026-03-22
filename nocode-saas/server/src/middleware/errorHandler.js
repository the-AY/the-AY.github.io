function errorHandler(err, req, res, next) {
  console.error('Error:', err.message);
  console.error(err.stack);

  if (err.code === '23505') {
    return res.status(409).json({ error: 'Resource already exists' });
  }

  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referenced resource not found' });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
}

module.exports = errorHandler;
