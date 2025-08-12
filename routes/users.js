// backend/routes/users.js
import express from 'express';
import { pool } from '../config/db.js';
import { validateRegistration } from '../middleware/validation.js';
import { successResponse, errorResponse, validationErrorResponse } from '../middleware/responseFormatter.js';

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
  
  // Handle frontend field mapping: organization <-> institution, district <-> country
  if (req.body.organization && !req.body.institution) {
    req.body.institution = req.body.organization;
  }
  if (req.body.district && !req.body.country) {
    req.body.country = req.body.district;
  }
  // Also support reverse mapping for flexibility
  if (req.body.institution && !req.body.organization) {
    req.body.organization = req.body.institution;
  }
  if (req.body.country && !req.body.district) {
    req.body.district = req.body.country;
  }
  
  next();
}, validateRegistration, async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      institution,
      organization,
      phone,
      position,
      country,
      district,
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
        organization, 
        phone, 
        position, 
        country,
        district, 
        session_track, 
        registration_type, 
        dietary_requirements, 
        special_needs, 
        status
      ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [
        first_name,
        last_name,
        email,
        institution || organization,
        organization || institution,
        phone,
        position,
        country || district,
        district || country,
        session_track,
        registration_type,
        dietary_requirements,
        special_needs,
        status || 'pending'
      ]
    );

    return successResponse(res, result.rows[0], 'Registration created successfully', {
      action: 'view_registration',
      url: `/registrations/${result.rows[0].id}`
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return errorResponse(res, 'Failed to create registration', 500);
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
    
    return successResponse(res, {
      data: registrations,
      stats: stats
    }, 'Registrations retrieved successfully');
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return errorResponse(res, 'Failed to fetch registrations', 500);
  }
});

// READ - Get registration by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM registrations WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return errorResponse(res, 'Registration not found', 404);
    }
    
    return successResponse(res, result.rows[0], 'Registration retrieved successfully');
  } catch (error) {
    console.error('Error fetching registration:', error);
    return errorResponse(res, 'Failed to fetch registration', 500);
  }
});

// UPDATE
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Handle frontend field mapping for updates too
    if (req.body.organization && !req.body.institution) {
      req.body.institution = req.body.organization;
    }
    if (req.body.district && !req.body.country) {
      req.body.country = req.body.district;
    }
    if (req.body.institution && !req.body.organization) {
      req.body.organization = req.body.institution;
    }
    if (req.body.country && !req.body.district) {
      req.body.district = req.body.country;
    }
    
    const {
      first_name,
      last_name,
      email,
      institution,
      organization,
      phone,
      position,
      country,
      district,
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
        organization = $5,
        phone = $6,
        position = $7,
        country = $8,
        district = $9,
        session_track = $10,
        registration_type = $11,
        dietary_requirements = $12,
        special_needs = $13,
        status = $14,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $15 RETURNING *`,
      [
        first_name,
        last_name,
        email,
        institution || organization,
        organization || institution,
        phone,
        position,
        country || district,
        district || country,
        session_track,
        registration_type,
        dietary_requirements,
        special_needs,
        status,
        id
      ]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 'Registration not found', 404);
    }

    return successResponse(res, result.rows[0], 'Registration updated successfully', {
      action: 'view_registration',
      url: `/registrations/${result.rows[0].id}`
    });
  } catch (error) {
    console.error('Error updating registration:', error);
    return errorResponse(res, 'Failed to update registration', 500);
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM registrations WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return errorResponse(res, 'Registration not found', 404);
    }
    
    return successResponse(res, { 
      message: 'Registration deleted successfully', 
      deleted: result.rows[0] 
    }, 'Registration deleted successfully');
  } catch (error) {
    console.error('Error deleting registration:', error);
    return errorResponse(res, 'Failed to delete registration', 500);
  }
});

// BULK ACTIONS - Update multiple registrations status
router.patch('/bulk/status', async (req, res) => {
  try {
    const { ids, status } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return validationErrorResponse(res, 'IDs array is required');
    }

    if (!['pending', 'confirmed', 'cancelled', 'waitlist'].includes(status)) {
      return validationErrorResponse(res, 'Invalid status. Must be: pending, confirmed, cancelled, or waitlist');
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

    return successResponse(res, {
      message: `${result.rows.length} registrations updated successfully`,
      updated: result.rows
    }, `Bulk status update completed - ${result.rows.length} registrations updated to "${status}"`);
  } catch (error) {
    console.error('Error bulk updating registrations:', error);
    return errorResponse(res, 'Failed to update registrations', 500);
  }
});

// BULK ACTIONS - Delete multiple registrations
router.delete('/bulk', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return validationErrorResponse(res, 'IDs array is required');
    }

    const placeholders = ids.map((_, index) => `$${index + 1}`).join(',');
    
    const result = await pool.query(
      `DELETE FROM registrations WHERE id IN (${placeholders}) RETURNING *`,
      ids
    );

    return successResponse(res, {
      message: `${result.rows.length} registrations deleted successfully`,
      deleted: result.rows
    }, `Bulk deletion completed - ${result.rows.length} registrations deleted`);
  } catch (error) {
    console.error('Error bulk deleting registrations:', error);
    return errorResponse(res, 'Failed to delete registrations', 500);
  }
});

export default router;