const express = require('express');
const { pool } = require('../config/db');

const router = express.Router();

// POST /api/abstracts - Submit new abstract
router.post('/', async (req, res) => {
  console.log('Creating new abstract:', req.body);
  
  try {
    const {
      title,
      abstract,
      authors,
      corresponding_author_email,
      track,
      keywords
    } = req.body;

    // Validate required fields
    if (!title || !abstract || !authors || !corresponding_author_email) {
      return res.status(400).json({
        success: false,
        message: 'Title, abstract, authors, and corresponding author email are required'
      });
    }

    // Insert new abstract
    const insertQuery = `
      INSERT INTO abstracts (
        title, presentation_type, category, primary_author, abstract_summary, keywords,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, 'submitted')
    `;

    const [result] = await pool.execute(insertQuery, [
      title,
      'oral',
      track || 'General',
      JSON.stringify(authors),
      abstract,
      keywords ? JSON.stringify(keywords) : null
    ]);

    console.log('Abstract created successfully with ID:', result.insertId);

    res.status(201).json({
      success: true,
      message: 'Abstract submitted successfully',
      data: {
        id: result.insertId,
        status: 'submitted'
      }
    });

  } catch (error) {
    console.error('Error creating abstract:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// GET /api/abstracts - Get all abstracts
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT id, title, presentation_type, category, primary_author, abstract_summary, keywords, status,
             created_at, updated_at
      FROM abstracts 
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      data: rows
    });

  } catch (error) {
    console.error('Error fetching abstracts:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
