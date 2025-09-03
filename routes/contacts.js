const express = require('express');
const { pool } = require('../config/db');

const router = express.Router();

// POST /api/contacts - Create new contact
router.post('/', async (req, res) => {
  console.log('Creating new contact:', req.body);
  
  try {
    const {
      name,
      email,
      organization,
      subject,
      message,
      inquiryType
    } = req.body;

    // Validate required fields
    if (!inquiryType || !name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Inquiry type, name, email, and message are required'
      });
    }

    // Insert new contact
    const insertQuery = `
      INSERT INTO contacts (
        name, email, organization, subject, message, inquiry_type,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'submitted', NOW(), NOW())
    `;

    const [result] = await pool.execute(insertQuery, [
      name,
      email,
      organization || null,
      subject,
      message,
      inquiryType || null
    ]);

    console.log('Contact created successfully with ID:', result.insertId);

    res.status(201).json({
      id: result.insertId,
      message: 'Contact message submitted successfully'
    });

  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// GET /api/contacts - Get all contacts
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT id, name, email, organization, subject, inquiry_type, status,
             created_at, updated_at
      FROM contacts 
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      data: rows
    });

  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
