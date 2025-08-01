// backend/routes/users.js
import express from 'express';
import { pool } from '../config/db.js';

const router = express.Router();

// CREATE
router.post('/', async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      institution,
      phone,
      position,
      country,
      session_track,
      registration_type,
      dietary_requirements,
      special_needs,
      status
    } = req.body;

    const result = await pool.query(
      `INSERT INTO registrations(
        first_name, 
        last_name, 
        email, 
        institution, 
        phone, 
        position, 
        country, 
        session_track, 
        registration_type, 
        dietary_requirements, 
        special_needs, 
        status
      ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        first_name,
        last_name,
        email,
        institution,
        phone,
        position,
        country,
        session_track,
        registration_type,
        dietary_requirements,
        special_needs,
        status
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// READ
router.get('/', async (req, res) => {
  const result = await pool.query('SELECT * FROM users ORDER BY id ASC');
  res.json(result.rows);
});

// UPDATE
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  const result = await pool.query('UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING *', [name, email, id]);
  res.json(result.rows[0]);
});

// DELETE
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM users WHERE id = $1', [id]);
  res.json({ message: 'User deleted' });
});

export default router;