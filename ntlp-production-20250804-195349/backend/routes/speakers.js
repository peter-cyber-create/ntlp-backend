// backend/routes/speakers.js
import express from 'express';
import { pool } from '../config/db.js';

const router = express.Router();

// CREATE speaker
router.post('/', async (req, res) => {
  try {
    const {
      name,
      title,
      biography,
      institution,
      email,
      photo_url,
      linkedin_url,
      twitter_url,
      website_url,
      research_interests,
      keynote_speaker
    } = req.body;

    // Validate required fields
    if (!name || !title || !biography) {
      return res.status(400).json({ error: 'Name, title, and biography are required' });
    }

    const result = await pool.query(
      `INSERT INTO speakers(
        name, 
        title, 
        biography, 
        institution, 
        email, 
        photo_url, 
        linkedin_url, 
        twitter_url, 
        website_url, 
        research_interests,
        keynote_speaker,
        created_at,
        updated_at
      ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *`,
      [name, title, biography, institution, email, photo_url, linkedin_url, twitter_url, website_url, research_interests, keynote_speaker || false]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating speaker:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// READ - Get all speakers
router.get('/', async (req, res) => {
  try {
    const { keynote } = req.query;
    let query = 'SELECT * FROM speakers';
    let params = [];

    if (keynote !== undefined) {
      query += ' WHERE keynote_speaker = $1';
      params.push(keynote === 'true');
    }

    query += ' ORDER BY name ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching speakers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// READ - Get speaker by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM speakers WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Speaker not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching speaker:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// UPDATE speaker
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      title,
      biography,
      institution,
      email,
      photo_url,
      linkedin_url,
      twitter_url,
      website_url,
      research_interests,
      keynote_speaker
    } = req.body;

    const result = await pool.query(
      `UPDATE speakers SET 
        name = $1,
        title = $2,
        biography = $3,
        institution = $4,
        email = $5,
        photo_url = $6,
        linkedin_url = $7,
        twitter_url = $8,
        website_url = $9,
        research_interests = $10,
        keynote_speaker = $11,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $12 RETURNING *`,
      [name, title, biography, institution, email, photo_url, linkedin_url, twitter_url, website_url, research_interests, keynote_speaker, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Speaker not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating speaker:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE speaker
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM speakers WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Speaker not found' });
    }
    
    res.json({ message: 'Speaker deleted successfully', deleted: result.rows[0] });
  } catch (error) {
    console.error('Error deleting speaker:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
