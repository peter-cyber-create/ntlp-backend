// backend/routes/activities.js
import express from 'express';
import { pool } from '../config/db.js';

const router = express.Router();

// CREATE
router.post('/', async (req, res) => {
    const { title, description } = req.body;
    const result = await pool.query('INSERT INTO activities(title, description) VALUES($1, $2) RETURNING *', [title, description]);
    res.json(result.rows[0]);
});

// READ
router.get('/', async (req, res) => {
    const result = await pool.query('SELECT * FROM activities ORDER BY id ASC');
    res.json(result.rows);
});

// UPDATE
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { title, description } = req.body;
    const result = await pool.query('UPDATE activities SET title = $1, description = $2 WHERE id = $3 RETURNING *', [title, description, id]);
    res.json(result.rows[0]);
});

// DELETE
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    await pool.query('DELETE FROM activities WHERE id = $1', [id]);
    res.json({ message: 'Activity deleted' });
});

export default router;