// backend/routes/registrations.js
import express from 'express';
import mysql from 'mysql2/promise';
import fs from 'fs';

import { pool } from '../config/db.js';

const router = express.Router();

// Register for a session
router.post('/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { registration_id } = req.body;

    if (!registration_id) {
      return res.status(400).json({ error: 'Registration ID is required' });
    }

    // Check if session exists and has capacity
    const [sessionRows] = await pool.query(
      'SELECT * FROM sessions WHERE id = ? AND status = "published"',
      [sessionId]
    );
    if (sessionRows.length === 0) {
      return res.status(404).json({ error: 'Session not found or not published' });
    }
    const session = sessionRows[0];
    
    // Check current registrations
    const [countRows] = await pool.query(
      'SELECT COUNT(*) as count FROM session_registrations WHERE session_id = ? AND status = "registered"',
      [sessionId]
    );
    const currentCount = parseInt(countRows[0].count);
    if (session.capacity && currentCount >= session.capacity) {
      return res.status(400).json({ error: 'Session is full' });
    }
    
    // Check if already registered
    const [existingRows] = await pool.query(
      'SELECT * FROM session_registrations WHERE session_id = ? AND registration_id = ?',
      [sessionId, registration_id]
    );
    if (existingRows.length > 0) {
      return res.status(400).json({ error: 'Already registered for this session' });
    }
    
    // Register for session
    const [insertResult] = await pool.query(
      'INSERT INTO session_registrations (session_id, registration_id, status) VALUES (?, ?, "registered")',
      [sessionId, registration_id]
    );
    
    // Update session registration count
    await pool.query(
      'UPDATE sessions SET current_registrations = current_registrations + 1 WHERE id = ?',
      [sessionId]
    );
    
    // Fetch the inserted row
    const [newRows] = await pool.query(
      'SELECT * FROM session_registrations WHERE id = ?',
      [insertResult.insertId]
    );
    res.status(201).json(newRows[0]);
  } catch (error) {
    console.error('Error registering for session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Unregister from a session
router.delete('/sessions/:sessionId/:registrationId', async (req, res) => {
  try {
    const { sessionId, registrationId } = req.params;

    const result = await pool.query(
      'DELETE FROM session_registrations WHERE session_id = ? AND registration_id = ?',
      [sessionId, registrationId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    // Update session registration count
    await pool.query(
      'UPDATE sessions SET current_registrations = GREATEST(current_registrations - 1, 0) WHERE id = ?',
      [sessionId]
    );

    res.json({ message: 'Unregistered from session successfully' });
  } catch (error) {
    console.error('Error unregistering from session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register for an activity
router.post('/activities/:activityId', async (req, res) => {
  try {
    const { activityId } = req.params;
    const { registration_id } = req.body;

    if (!registration_id) {
      return res.status(400).json({ error: 'Registration ID is required' });
    }

    // Check if activity exists and has capacity
    const [activityRows] = await pool.query(
      'SELECT * FROM activities WHERE id = ? AND status = "active"',
      [activityId]
    );
    if (activityRows.length === 0) {
      return res.status(404).json({ error: 'Activity not found or not active' });
    }
    const activity = activityRows[0];
    
    // Check current registrations
    const [countRows] = await pool.query(
      'SELECT COUNT(*) as count FROM activity_registrations WHERE activity_id = ? AND status = "registered"',
      [activityId]
    );
    const currentCount = parseInt(countRows[0].count);
    if (activity.capacity && currentCount >= activity.capacity) {
      return res.status(400).json({ error: 'Activity is full' });
    }
    
    // Check if already registered
    const [existingRows] = await pool.query(
      'SELECT * FROM activity_registrations WHERE activity_id = ? AND registration_id = ?',
      [activityId, registration_id]
    );
    if (existingRows.length > 0) {
      return res.status(400).json({ error: 'Already registered for this activity' });
    }
    
    // Register for activity
    const [insertResult] = await pool.query(
      'INSERT INTO activity_registrations (activity_id, registration_id, status) VALUES (?, ?, "registered")',
      [activityId, registration_id]
    );
    
    // Update activity registration count
    await pool.query(
      'UPDATE activities SET current_registrations = current_registrations + 1 WHERE id = ?',
      [activityId]
    );
    
    // Fetch the inserted row
    const [newRows] = await pool.query(
      'SELECT * FROM activity_registrations WHERE id = ?',
      [insertResult.insertId]
    );
    res.status(201).json(newRows[0]);
  } catch (error) {
    console.error('Error registering for activity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Unregister from an activity
router.delete('/activities/:activityId/:registrationId', async (req, res) => {
  try {
    const { activityId, registrationId } = req.params;

    const result = await pool.query(
      'DELETE FROM activity_registrations WHERE activity_id = ? AND registration_id = ?',
      [activityId, registrationId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    // Update activity registration count
    await pool.query(
      'UPDATE activities SET current_registrations = GREATEST(current_registrations - 1, 0) WHERE id = ?',
      [activityId]
    );

    res.json({ message: 'Unregistered from activity successfully' });
  } catch (error) {
    console.error('Error unregistering from activity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get registrations for a user
router.get('/user/:registrationId', async (req, res) => {
  try {
    const { registrationId } = req.params;

    // Get session registrations
    const [sessionRegistrations] = await pool.query(`
      SELECT s.*, sr.registered_at, sr.status
      FROM sessions s
      JOIN session_registrations sr ON s.id = sr.session_id
      WHERE sr.registration_id = ? AND s.status = "published"
      ORDER BY s.date ASC, s.start_time ASC
    `, [registrationId]);

    // Get activity registrations
    const [activityRegistrations] = await pool.query(`
      SELECT a.*, ar.registered_at, ar.status
      FROM activities a
      JOIN activity_registrations ar ON a.id = ar.activity_id
      WHERE ar.registration_id = ? AND a.status = "active"
      ORDER BY a.date ASC, a.time ASC
    `, [registrationId]);

    res.json({
      sessions: sessionRegistrations,
      activities: activityRegistrations
    });
  } catch (error) {
    console.error('Error fetching user registrations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register for the conference (main registration form)
router.post('/', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      organization,
      position,
      district,
      registrationType,
      specialRequirements,
      dietary_requirements,
      paymentProofUrl
    } = req.body;

    // Map frontend fields to DB columns
    const dbData = {
      firstName: firstName,
      lastName: lastName,
      email,
      organization: organization || null,
      phone: phone || null,
      position: position || null,
      district: district || null,
      registrationType: registrationType,
      dietary_requirements: dietary_requirements || null,
      specialRequirements: specialRequirements || null,
      payment_proof_url: paymentProofUrl || null
    };

    // Validate required fields
    const missingFields = [];
    if (!dbData.firstName) missingFields.push('firstName');
    if (!dbData.lastName) missingFields.push('lastName');
    if (!dbData.email) missingFields.push('email');
    if (!dbData.registrationType) missingFields.push('registrationType');
    if (missingFields.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });
    }

    // Check if email already exists
    const [existingRows] = await pool.query(
      'SELECT id FROM registrations WHERE email = ?',
      [dbData.email]
    );
    if (existingRows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Insert registration into DB with 'submitted' status
    const insertQuery = `
      INSERT INTO registrations (
        firstName, lastName, email, organization, phone, position, district, 
        registrationType, payment_proof_url, payment_status, dietary_requirements, specialRequirements, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', NOW(), NOW())
    `;
    const [result] = await pool.query(insertQuery, [
      dbData.firstName,
      dbData.lastName,
      dbData.email,
      dbData.organization,
      dbData.phone,
      dbData.position,
      dbData.district,
      dbData.registrationType,
      dbData.payment_proof_url || null,
      'pending',
      dbData.dietary_requirements,
      dbData.specialRequirements
    ]);

    // Create form submission record
    await pool.query(`
      INSERT INTO form_submissions (
        form_type, entity_id, submitted_by, submission_data, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'submitted', NOW(), NOW())
    `, [
      'registration',
      result.insertId,
      dbData.email,
      JSON.stringify(req.body)
    ]);

    // Fetch the inserted registration
    const [rows] = await pool.query('SELECT * FROM registrations WHERE id = ?', [result.insertId]);
    const newRegistration = rows[0];

    // Respond with success
    res.status(201).json({
      message: 'Registration submitted successfully and is under review',
      registration: newRegistration,
      status: 'submitted'
    });
  } catch (error) {
    console.error('Error submitting registration:', error);
    res.status(500).json({ error: 'Failed to submit registration' });
  }
});

// Get all registrations (admin only)
router.get('/', async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    let params = [];
    
    if (status && status !== 'all') {
      whereClause += ' AND status = ?';
      params.push(status);
    }
    
    if (search) {
      whereClause += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM registrations ${whereClause}`,
      params
    );
    const total = countResult[0].total;
    
    // Get registrations with pagination
    const [registrations] = await pool.query(
      `SELECT * FROM registrations ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    
    res.json({
      registrations,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update registration status (admin review)
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes, review_comments } = req.body;
    
    if (!['submitted', 'under_review', 'approved', 'rejected', 'waitlist', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const updateQuery = `
      UPDATE registrations SET 
        status = ?, 
        admin_notes = ?, 
        review_comments = ?,
        reviewed_at = NOW(),
        updated_at = NOW()
      WHERE id = ?
    `;
    
    const [result] = await pool.query(updateQuery, [status, admin_notes, review_comments, id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Registration not found' });
    }
    
    // Update form submission status
    await pool.query(`
      UPDATE form_submissions SET 
        status = ?, 
        admin_notes = ?, 
        review_comments = ?,
        reviewed_at = NOW(),
        updated_at = NOW()
      WHERE form_type = 'registration' AND entity_id = ?
    `, [status, admin_notes, review_comments, id]);
    
    // Fetch updated registration
    const [rows] = await pool.query('SELECT * FROM registrations WHERE id = ?', [id]);
    
    res.json({
      message: `Registration status updated to ${status}`,
      registration: rows[0]
    });
  } catch (error) {
    console.error('Error updating registration status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk update registration statuses
router.patch('/bulk/status', async (req, res) => {
  try {
    const { ids, status, admin_notes, review_comments } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'IDs array is required' });
    }
    
    if (!['submitted', 'under_review', 'approved', 'rejected', 'waitlist', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const placeholders = ids.map(() => '?').join(',');
    const params = [...ids, status, admin_notes || null, review_comments || null];
    
    // Update registrations
    const [result] = await pool.query(
      `UPDATE registrations SET 
        status = ?, 
        admin_notes = ?, 
        review_comments = ?,
        reviewed_at = NOW(),
        updated_at = NOW()
      WHERE id IN (${placeholders})`,
      params
    );
    
    // Update form submissions
    await pool.query(
      `UPDATE form_submissions SET 
        status = ?, 
        admin_notes = ?, 
        review_comments = ?,
        reviewed_at = NOW(),
        updated_at = NOW()
      WHERE form_type = 'registration' AND entity_id IN (${placeholders})`,
      params
    );
    
    res.json({
      message: `${result.affectedRows} registrations updated successfully`,
      updatedCount: result.affectedRows
    });
  } catch (error) {
    console.error('Error bulk updating registrations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get registration statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_registrations,
        COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted,
        COUNT(CASE WHEN status = 'under_review' THEN 1 END) as under_review,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN status = 'waitlist' THEN 1 END) as waitlist,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL 7 DAY THEN 1 END) as new_this_week
      FROM registrations
    `);
    
    const [typeStats] = await pool.query(`
      SELECT registration_type, COUNT(*) as count
      FROM registrations
      WHERE registration_type IS NOT NULL
      GROUP BY registration_type
      ORDER BY count DESC
    `);
    
    res.json({
      overview: stats[0],
      by_type: typeStats
    });
  } catch (error) {
    console.error('Error fetching registration statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/register/:id - Delete registration
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // First check if registration exists
    const [rows] = await pool.query('SELECT * FROM registrations WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Registration not found' });
    }
    
    const registration = rows[0];
    
    // Delete payment proof file if it exists
    if (registration.payment_proof_url && fs.existsSync(registration.payment_proof_url)) {
      try {
        fs.unlinkSync(registration.payment_proof_url);
      } catch (fileError) {
        console.warn('Could not delete payment proof file:', fileError);
      }
    }
    
    // Delete from database
    await pool.query('DELETE FROM registrations WHERE id = ?', [id]);
    
    res.json({ 
      message: 'Registration deleted successfully',
      deletedId: id 
    });
    
  } catch (error) {
    console.error('Error deleting registration:', error);
    res.status(500).json({ error: 'Failed to delete registration' });
  }
});

// PATCH /api/register/:id/status - Update registration status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, reviewedBy } = req.body;
    
    // Validate status
    const validStatuses = ['submitted', 'under_review', 'approved', 'rejected', 'waitlist', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    // Check if registration exists
    const [rows] = await pool.query('SELECT * FROM registrations WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Registration not found' });
    }
    
    // Update registration status
    await pool.query(
      'UPDATE registrations SET status = ?, admin_notes = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, adminNotes || null, reviewedBy || null, id]
    );
    
    // Get updated registration
    const [updatedRows] = await pool.query('SELECT * FROM registrations WHERE id = ?', [id]);
    
    res.json({
      message: 'Registration status updated successfully',
      registration: updatedRows[0]
    });
    
  } catch (error) {
    console.error('Error updating registration status:', error);
    res.status(500).json({ error: 'Failed to update registration status' });
  }
});

// PUT /api/register/:id - Update entire registration
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      organization, 
      position, 
      registrationType,
      dietary_requirements,
      specialRequirements
    } = req.body;
    
    // Check if registration exists
    const [rows] = await pool.query('SELECT * FROM registrations WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Registration not found' });
    }
    
    // Update registration
    await pool.query(
      `UPDATE registrations SET 
        firstName = ?, 
        lastName = ?, 
        email = ?, 
        phone = ?, 
        organization = ?, 
        position = ?, 
        registrationType = ?,
        dietary_requirements = ?,
        specialRequirements = ?,
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?`,
      [
        firstName,
        lastName,
        email,
        phone,
        organization,
        position,
        registrationType,
        dietary_requirements,
        specialRequirements,
        id
      ]
    );
    
    // Get updated registration
    const [updatedRows] = await pool.query('SELECT * FROM registrations WHERE id = ?', [id]);
    
    res.json({
      message: 'Registration updated successfully',
      registration: updatedRows[0]
    });
    
  } catch (error) {
    console.error('Error updating registration:', error);
    res.status(500).json({ error: 'Failed to update registration' });
  }
});

export default router;
