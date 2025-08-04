// backend/routes/announcements.js
import express from 'express';
import { pool } from '../config/db.js';

const router = express.Router();

// CREATE announcement
router.post('/', async (req, res) => {
  try {
    const {
      title,
      content,
      priority,
      type,
      start_date,
      end_date,
      published
    } = req.body;

    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const result = await pool.query(
      `INSERT INTO announcements(
        title, 
        content, 
        priority, 
        type, 
        start_date, 
        end_date, 
        published,
        created_at,
        updated_at
      ) VALUES($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *`,
      [title, content, priority || 'normal', type || 'general', start_date, end_date, published || true]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// READ - Get all announcements
router.get('/', async (req, res) => {
  try {
    const { published, type, priority } = req.query;
    let query = 'SELECT * FROM announcements';
    let params = [];
    const conditions = [];

    if (published !== undefined) {
      conditions.push(`published = $${params.length + 1}`);
      params.push(published === 'true');
    }

    if (type) {
      conditions.push(`type = $${params.length + 1}`);
      params.push(type);
    }

    if (priority) {
      conditions.push(`priority = $${params.length + 1}`);
      params.push(priority);
    }

    // Add date filtering for active announcements
    const currentDate = new Date().toISOString().split('T')[0];
    conditions.push(`(start_date IS NULL OR start_date <= $${params.length + 1})`);
    params.push(currentDate);
    conditions.push(`(end_date IS NULL OR end_date >= $${params.length + 1})`);
    params.push(currentDate);

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY priority DESC, created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// READ - Get announcement by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM announcements WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching announcement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// UPDATE announcement
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      content,
      priority,
      type,
      start_date,
      end_date,
      published
    } = req.body;

    const result = await pool.query(
      `UPDATE announcements SET 
        title = $1,
        content = $2,
        priority = $3,
        type = $4,
        start_date = $5,
        end_date = $6,
        published = $7,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8 RETURNING *`,
      [title, content, priority, type, start_date, end_date, published, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE announcement
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM announcements WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    
    res.json({ message: 'Announcement deleted successfully', deleted: result.rows[0] });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
