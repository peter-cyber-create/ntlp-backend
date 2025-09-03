const express = require('express');
const { pool } = require('../config/db');

const router = express.Router();



// POST /api/registrations - Create new registration
router.post('/', async (req, res) => {
  console.log('Creating new registration:', req.body);
  
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      organization,
      position,
      country,
      specialRequirements
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !organization || !position || !country) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, email, phone, organization, position, and country are required'
      });
    }

    // Insert new registration
    const insertQuery = `
      INSERT INTO registrations (
        first_name, last_name, email, phone, organization, position, 
        country, special_requirements, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'submitted', NOW(), NOW())
    `;

    const [result] = await pool.execute(insertQuery, [
      firstName,
      lastName,
      email,
      phone,
      organization,
      position,
      country,
      specialRequirements || null
    ]);

    console.log('Registration created successfully with ID:', result.insertId);

    res.status(201).json({
      id: result.insertId,
      message: 'Registration submitted successfully'
    });

  } catch (error) {
    console.error('Error creating registration:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// PATCH /api/registrations/:id/status - Update registration status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const [result] = await pool.execute(
      'UPDATE registrations SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    res.json({
      success: true,
      message: 'Status updated successfully'
    });

  } catch (error) {
    console.error('Error updating registration status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/registrations - Get all registrations
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT id, first_name, last_name, email, phone, organization, position, 
             country, special_requirements, status, created_at, updated_at
      FROM registrations 
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      data: rows
    });

  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
