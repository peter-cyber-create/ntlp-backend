
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

    const insertQuery =
      `INSERT INTO sponsorships (
        company_name,
        contact_person,
        email,
        phone,
        website,
        industry,
        special_requirements,
        selected_package,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`;

    const [result] = await pool.query(insertQuery, [
      companyName,
      contactPerson,
      email,
      phone,
      website,
      industry,
      specialRequirements,
      selectedPackage || null
    ]);

    // Fetch the inserted row
    const [rows] = await pool.query('SELECT * FROM sponsorships WHERE id = ?', [result.insertId]);

    res.status(201).json({
      message: 'Sponsorship application submitted successfully',
      sponsorship: rows[0]
    });
  } catch (error) {
    console.error('Error creating sponsorship:', error);
    res.status(500).json({ error: 'Failed to submit sponsorship application' });
  }
});

export default router;
