const express = require('express');
const router = express.Router();
const { pool, healthCheck } = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const dbStatus = await healthCheck();
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'NTLP Backend API',
      version: '1.0.0',
      uptime: process.uptime() + ' seconds',
      memory: process.memoryUsage(),
      database: dbStatus,
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
