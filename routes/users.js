// backend/routes/users.js
import express from 'express';
import { pool } from '../config/db.js';
import { validateRegistration } from '../middleware/validation.js';

const router = express.Router();

// CREATE
router.post('/', (req, res, next) => {
  // Handle frontend sending 'name' instead of first_name/last_name
  if (req.body.name && !req.body.first_name && !req.body.last_name) {
    const nameParts = req.body.name.trim().split(' ');
    req.body.first_name = nameParts[0] || '';
    req.body.last_name = nameParts.slice(1).join(' ') || '';
    delete req.body.name;
  }
  next();
}, validateRegistration, async (req, res) => {
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

// READ - Get all registrations
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM registrations ORDER BY created_at DESC');
    
    // Calculate stats
    const registrations = result.rows;
    const stats = {
      total: registrations.length,
      byType: {},
      byCountry: {}
    };
    
    registrations.forEach(reg => {
      // Count by registration type
      const type = reg.registration_type || 'unknown';
      stats.byType[type] = (stats.byType[type] || 0) + 1;
      
      // Count by country
      const country = reg.country || 'unknown';
      stats.byCountry[country] = (stats.byCountry[country] || 0) + 1;
    });
    
    res.json({
      data: registrations,
      stats: stats
    });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// READ - Get registration by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM registrations WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Registration not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching registration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// UPDATE
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
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
      `UPDATE registrations SET 
        first_name = $1,
        last_name = $2,
        email = $3,
        institution = $4,
        phone = $5,
        position = $6,
        country = $7,
        session_track = $8,
        registration_type = $9,
        dietary_requirements = $10,
        special_needs = $11,
        status = $12,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $13 RETURNING *`,
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
        status,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating registration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM registrations WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Registration not found' });
    }
    
    res.json({ message: 'Registration deleted successfully', deleted: result.rows[0] });
  } catch (error) {
    console.error('Error deleting registration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// BULK ACTIONS - Update multiple registrations status
router.patch('/bulk/status', async (req, res) => {
  try {
    const { ids, status } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'IDs array is required' });
    }

    if (!['pending', 'confirmed', 'cancelled', 'waitlist'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const placeholders = ids.map((_, index) => `$${index + 1}`).join(',');
    const params = [...ids, status];

    const result = await pool.query(
      `UPDATE registrations SET 
        status = $${ids.length + 1},
        updated_at = CURRENT_TIMESTAMP
      WHERE id IN (${placeholders}) RETURNING *`,
      params
    );

    res.json({
      message: `${result.rows.length} registrations updated successfully`,
      updated: result.rows
    });
  } catch (error) {
    console.error('Error bulk updating registrations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// BULK ACTIONS - Delete multiple registrations
router.delete('/bulk', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'IDs array is required' });
    }

    const placeholders = ids.map((_, index) => `$${index + 1}`).join(',');
    
    const result = await pool.query(
      `DELETE FROM registrations WHERE id IN (${placeholders}) RETURNING *`,
      ids
    );

    res.json({
      message: `${result.rows.length} registrations deleted successfully`,
      deleted: result.rows
    });
  } catch (error) {
    console.error('Error bulk deleting registrations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;