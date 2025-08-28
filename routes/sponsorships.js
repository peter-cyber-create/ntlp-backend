
import express from 'express';
import { pool } from '../config/db.js';

const router = express.Router();

// POST /api/sponsorships - Create new sponsorship application
router.post('/', async (req, res) => {
  try {
    const {
      companyName,
      contactPerson,
      email,
      phone,
      website,
      industry,
      specialRequirements,
      selectedPackage
    } = req.body;

    // Explicit validation for required fields
    const missingFields = [];
    if (!companyName) missingFields.push('companyName');
    if (!contactPerson) missingFields.push('contactPerson');
    if (!email) missingFields.push('email');
    if (!selectedPackage) missingFields.push('selectedPackage');
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Validate package type
    const validPackages = [
      'Platinum Sponsor',
      'Gold Sponsor',
      'Silver Sponsor',
      'Bronze Sponsor'
    ];
    if (!validPackages.includes(selectedPackage)) {
      return res.status(400).json({
        error: `Invalid sponsorship package type: ${selectedPackage}. Valid options are: ${validPackages.join(', ')}`
      });
    }

    const insertQuery =
      `INSERT INTO sponsorships (
        company_name,
        contact_person,
        email,
        phone,
        package_type,
        status,
        created_at
      ) VALUES (?, ?, ?, ?, ?, 'submitted', CURRENT_TIMESTAMP)`;

    const [result] = await pool.query(insertQuery, [
      companyName,
      contactPerson,
      email,
      phone,
      selectedPackage
    ]);

    // Create form submission record for admin review
    await pool.query(`
      INSERT INTO form_submissions (
        form_type, entity_id, submitted_by, submission_data, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'submitted', NOW(), NOW())
    `, [
      'sponsorship',
      result.insertId,
      `${companyName} - ${contactPerson}`,
      JSON.stringify({
        companyName,
        contactPerson,
        email,
        phone,
        selectedPackage
      })
    ]);

    // Fetch the inserted row
    const [rows] = await pool.query('SELECT * FROM sponsorships WHERE id = ?', [result.insertId]);

    res.status(201).json({
      message: 'Sponsorship application submitted successfully and is under review',
      sponsorship: rows[0]
    });
  } catch (error) {
    console.error('Error creating sponsorship:', error);
    res.status(500).json({ error: 'Failed to submit sponsorship application' });
  }
});

export default router;
