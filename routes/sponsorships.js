const express = require('express');
const { pool } = require('../config/db');

const router = express.Router();

// POST /api/sponsorships - Create new sponsorship
router.post('/', async (req, res) => {
  console.log('Creating new sponsorship:', req.body);
  
  try {
    const {
      companyName,
      contactPerson,
      email,
      phone,
      website,
      industry,
      specialRequirements,
      message
    } = req.body;

    // Validate required fields
    if (!companyName || !contactPerson || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Company name, contact person, email, and phone are required'
      });
    }

    // Insert new sponsorship using existing database fields
    const insertQuery = `
      INSERT INTO sponsorships (
        company_name, contact_person, email, phone, website, company_description,
        selected_package, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'bronze', 'submitted', NOW(), NOW())
    `;

    const [result] = await pool.execute(insertQuery, [
      companyName,
      contactPerson,
      email,
      phone,
      website || null,
      message || 'No description provided' // company_description is NOT NULL
    ]);

    console.log('Sponsorship created successfully with ID:', result.insertId);

    res.status(201).json({
      id: result.insertId,
      message: 'Sponsorship application submitted successfully'
    });

  } catch (error) {
    console.error('Error creating sponsorship:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// GET /api/sponsorships - Get all sponsorships
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT id, company_name, contact_person, email, phone, selected_package, 
             budget_range, additional_benefits, marketing_materials,
             company_description, website, address, district,
             sponsorship_history, target_audience, specific_requests,
             status, created_at, updated_at
      FROM sponsorships 
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      data: rows
    });

  } catch (error) {
    console.error('Error fetching sponsorships:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
