const express = require('express');
const { pool } = require('../config/db');

const router = express.Router();

// POST /api/test - Simple test route
router.post('/', async (req, res) => {
  console.log('Test route called with body:', req.body);
  
  try {
    // Direct database insert without any middleware
    const [result] = await pool.execute(
      "INSERT INTO contacts (name, email, subject, message, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'submitted', NOW(), NOW())",
      [
        req.body.name || 'Test Name',
        req.body.email || 'test@test.com',
        req.body.subject || 'Test Subject',
        req.body.message || 'Test Message'
      ]
    );

    console.log('Test insert successful, ID:', result.insertId);

    res.json({
      success: true,
      message: 'Test successful',
      id: result.insertId
    });

  } catch (error) {
    console.error('Test route error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
