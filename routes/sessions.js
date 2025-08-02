// backend/routes/sessions.js
import express from 'express';
import { pool } from '../config/db.js';

const router = express.Router();

// CREATE session
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      start_time,
      end_time,
      date,
      location,
      session_type,
      track,
      speaker_ids,
      capacity,
      registration_required
    } = req.body;

    // Validate required fields
    if (!title || !start_time || !end_time || !date) {
      return res.status(400).json({ error: 'Title, start time, end time, and date are required' });
    }

    const result = await pool.query(
      `INSERT INTO sessions(
        title, 
        description, 
        start_time, 
        end_time, 
        date, 
        location, 
        session_type, 
        track, 
        speaker_ids, 
        capacity, 
        registration_required,
        created_at,
        updated_at
      ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *`,
      [title, description, start_time, end_time, date, location, session_type, track, JSON.stringify(speaker_ids || []), capacity, registration_required || false]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// READ - Get all sessions
router.get('/', async (req, res) => {
  try {
    const { date, track, session_type } = req.query;
    let query = `
      SELECT s.*, 
        CASE 
          WHEN s.speaker_ids IS NOT NULL 
          THEN (
            SELECT json_agg(sp.*)
            FROM speakers sp
            WHERE sp.id = ANY(
              SELECT jsonb_array_elements_text(s.speaker_ids::jsonb)::int
            )
          )
          ELSE '[]'::json
        END as speakers
      FROM sessions s
    `;
    let params = [];
    const conditions = [];

    if (date) {
      conditions.push(`s.date = $${params.length + 1}`);
      params.push(date);
    }

    if (track) {
      conditions.push(`s.track = $${params.length + 1}`);
      params.push(track);
    }

    if (session_type) {
      conditions.push(`s.session_type = $${params.length + 1}`);
      params.push(session_type);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY s.date ASC, s.start_time ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// READ - Get session by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT s.*, 
        CASE 
          WHEN s.speaker_ids IS NOT NULL 
          THEN (
            SELECT json_agg(sp.*)
            FROM speakers sp
            WHERE sp.id = ANY(
              SELECT jsonb_array_elements_text(s.speaker_ids::jsonb)::int
            )
          )
          ELSE '[]'::json
        END as speakers
      FROM sessions s
      WHERE s.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// UPDATE session
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      start_time,
      end_time,
      date,
      location,
      session_type,
      track,
      speaker_ids,
      capacity,
      registration_required
    } = req.body;

    const result = await pool.query(
      `UPDATE sessions SET 
        title = $1,
        description = $2,
        start_time = $3,
        end_time = $4,
        date = $5,
        location = $6,
        session_type = $7,
        track = $8,
        speaker_ids = $9,
        capacity = $10,
        registration_required = $11,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $12 RETURNING *`,
      [title, description, start_time, end_time, date, location, session_type, track, JSON.stringify(speaker_ids || []), capacity, registration_required, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE session
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM sessions WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json({ message: 'Session deleted successfully', deleted: result.rows[0] });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
