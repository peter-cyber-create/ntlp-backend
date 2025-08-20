// backend/routes/activities.js
import express from 'express';
import { pool } from '../config/db.js';

const router = express.Router();

// CREATE
router.post('/', async (req, res) => {
  try {
    const { 
      title, 
      description, 
      date, 
      time, 
      location, 
      capacity, 
      registration_required,
      category 
    } = req.body;

    // Validate required fields
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const insertQuery =
      `INSERT INTO activities(
        title, 
        description, 
        date, 
        time, 
        location, 
        capacity, 
        registration_required,
        category,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`;

    const [result] = await pool.query(insertQuery, [title, description, date, time, location, capacity, registration_required, category]);

    // Fetch the inserted row
    const [rows] = await pool.query('SELECT * FROM activities WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// READ - Get all activities
router.get('/', async (req, res) => {
  try {
    const { category, date } = req.query;
    let query = 'SELECT * FROM activities';
    let params = [];

    if (category || date) {
      query += ' WHERE';
      const conditions = [];
      
      if (category) {
        conditions.push(` category = $${params.length + 1}`);
        params.push(category);
      }
      
      if (date) {
        conditions.push(` date = $${params.length + 1}`);
        params.push(date);
      }
      
      query += conditions.join(' AND');
    }

    query += ' ORDER BY date ASC, time ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// READ - Get activity by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM activities WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// UPDATE
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      date, 
      time, 
      location, 
      capacity, 
      registration_required,
      category 
    } = req.body;

    const result = await pool.query(
      `UPDATE activities SET 
        title = $1, 
        description = $2, 
        date = $3, 
        time = $4, 
        location = $5, 
        capacity = $6, 
        registration_required = $7,
        category = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9 RETURNING *`,
      [title, description, date, time, location, capacity, registration_required, category, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM activities WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    
    res.json({ message: 'Activity deleted successfully', deleted: result.rows[0] });
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;