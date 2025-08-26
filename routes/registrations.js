// backend/routes/registrations.js
import express from 'express';
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
      'SELECT * FROM sessions WHERE id = ?',
      [sessionId]
    );
    if (sessionRows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    const session = sessionRows[0];
    // Check current registrations
    const [countRows] = await pool.query(
      'SELECT COUNT(*) as count FROM session_registrations WHERE session_id = ?',
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
      'INSERT INTO session_registrations (session_id, registration_id) VALUES (?, ?)',
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
      'DELETE FROM session_registrations WHERE session_id = $1 AND registration_id = $2 RETURNING *',
      [sessionId, registrationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    // Update session registration count
    await pool.query(
      'UPDATE sessions SET current_registrations = GREATEST(current_registrations - 1, 0) WHERE id = $1',
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
      'SELECT * FROM activities WHERE id = ?',
      [activityId]
    );
    if (activityRows.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    const activity = activityRows[0];
    // Check current registrations
    const [countRows] = await pool.query(
      'SELECT COUNT(*) as count FROM activity_registrations WHERE activity_id = ?',
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
      'INSERT INTO activity_registrations (activity_id, registration_id) VALUES (?, ?)',
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
      'DELETE FROM activity_registrations WHERE activity_id = $1 AND registration_id = $2 RETURNING *',
      [activityId, registrationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    // Update activity registration count
    await pool.query(
      'UPDATE activities SET current_registrations = GREATEST(current_registrations - 1, 0) WHERE id = $1',
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
    const sessionRegistrations = await pool.query(`
      SELECT s.*, sr.registered_at
      FROM sessions s
      JOIN session_registrations sr ON s.id = sr.session_id
      WHERE sr.registration_id = $1
      ORDER BY s.date ASC, s.start_time ASC
    `, [registrationId]);

    // Get activity registrations
    const activityRegistrations = await pool.query(`
      SELECT a.*, ar.registered_at
      FROM activities a
      JOIN activity_registrations ar ON a.id = ar.activity_id
      WHERE ar.registration_id = $1
      ORDER BY a.date ASC, a.time ASC
    `, [registrationId]);

    res.json({
      sessions: sessionRegistrations.rows,
      activities: activityRegistrations.rows
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
      dietary_requirements
    } = req.body;

    // Validate required fields
    const missingFields = [];
    if (!firstName) missingFields.push('firstName');
    if (!lastName) missingFields.push('lastName');
    if (!email) missingFields.push('email');
    if (!registrationType) missingFields.push('registrationType');
    if (missingFields.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });
    }

    // Insert registration into DB
    const insertQuery = `
      INSERT INTO registrations (
        first_name, last_name, email, phone, organization, position, district, registration_type, special_requirements, dietary_requirements, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
    `;
    const [result] = await pool.query(insertQuery, [
      firstName,
      lastName,
      email,
      phone || null,
      organization || null,
      position || null,
      district || null,
      registrationType,
      specialRequirements || null,
      dietary_requirements || null
    ]);

    // Fetch the inserted registration
    const [rows] = await pool.query('SELECT * FROM registrations WHERE id = ?', [result.insertId]);
    const newRegistration = rows[0];

    // Respond with success
    res.status(201).json({
      message: 'Registration submitted successfully',
      registration: newRegistration
    });
  } catch (error) {
    console.error('Error submitting registration:', error);
    res.status(500).json({ error: 'Failed to submit registration' });
  }
});

export default router;
