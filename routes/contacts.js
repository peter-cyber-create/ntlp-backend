import express from 'express';
import { pool } from '../config/db.js';
import { validateContact } from '../middleware/validation.js';
import { sendContactConfirmation, sendAdminNotification, sendResponseEmail } from '../middleware/emailService.js';

const router = express.Router();

// GET /api/contacts - Get all contacts
router.get('/', async (req, res) => {
    try {
        console.log('Fetching contacts...');
        
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;

        // Get contacts with pagination
        const contactsQuery = `
            SELECT 
                id,
                name,
                email,
                phone,
                organization,
                subject,
                message,
                status,
                created_at as submitted_at,
                updated_at as responded_at
            FROM contacts 
            ORDER BY created_at DESC 
            LIMIT $1 OFFSET $2
        `;
        
        const contactsResult = await pool.query(contactsQuery, [limit, offset]);
        
        // Get total count
        const countResult = await pool.query('SELECT COUNT(*) FROM contacts');
        const total = parseInt(countResult.rows[0].count);
        
        // Get stats
        const statsQuery = `
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
                COUNT(CASE WHEN status = 'responded' THEN 1 END) as responded,
                COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as this_week
            FROM contacts
        `;
        
        const statsResult = await pool.query(statsQuery);
        const stats = statsResult.rows[0];
        
        res.json({
            contacts: contactsResult.rows,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            },
            stats: {
                total: parseInt(stats.total),
                pending: parseInt(stats.pending),
                responded: parseInt(stats.responded),
                thisWeek: parseInt(stats.this_week)
            }
        });
        
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({
            error: 'Internal server error',
            timestamp: new Date().toISOString()
        });
    }
});

// POST /api/contacts - Create new contact
router.post('/', validateContact, async (req, res) => {
    try {
        console.log('Creating new contact:', req.body);
        
        const { name, email, phone, organization, subject, message } = req.body;
        
        const query = `
            INSERT INTO contacts (name, email, phone, organization, subject, message, status, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW(), NOW())
            RETURNING *
        `;
        
        const values = [name, email, phone || null, organization || null, subject, message];
        const result = await pool.query(query, values);
        
        const newContact = result.rows[0];
        
        // Send email notifications asynchronously (don't wait for them)
        setImmediate(async () => {
            try {
                await sendContactConfirmation(newContact);
                await sendAdminNotification(newContact);
            } catch (emailError) {
                console.error('Email notification error:', emailError);
            }
        });
        
        res.status(201).json({
            message: 'Contact message submitted successfully',
            contact: newContact,
            timestamp: new Date().toISOString(),
            info: 'Confirmation email will be sent shortly'
        });
        
    } catch (error) {
        console.error('Error creating contact:', error);
        res.status(500).json({
            error: 'Failed to submit contact message',
            timestamp: new Date().toISOString()
        });
    }
});

// GET /api/contacts/:id - Get specific contact
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = `
            SELECT 
                id,
                name,
                email,
                phone,
                organization,
                subject,
                message,
                status,
                created_at as submitted_at,
                updated_at as responded_at
            FROM contacts 
            WHERE id = $1
        `;
        
        const result = await pool.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Contact not found',
                timestamp: new Date().toISOString()
            });
        }
        
        res.json(result.rows[0]);
        
    } catch (error) {
        console.error('Error fetching contact:', error);
        res.status(500).json({
            error: 'Internal server error',
            timestamp: new Date().toISOString()
        });
    }
});

// PUT /api/contacts/:id - Update contact status
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, response_message } = req.body;
        
        // First get the current contact data
        const currentContactQuery = `
            SELECT * FROM contacts WHERE id = $1
        `;
        const currentResult = await pool.query(currentContactQuery, [id]);
        
        if (currentResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Contact not found',
                timestamp: new Date().toISOString()
            });
        }
        
        const currentContact = currentResult.rows[0];
        
        // Update the contact
        const query = `
            UPDATE contacts 
            SET status = $1, response_message = $2, updated_at = NOW()
            WHERE id = $3
            RETURNING *
        `;
        
        const result = await pool.query(query, [status, response_message || null, id]);
        const updatedContact = result.rows[0];
        
        // If status changed to 'responded' and there's a response message, send email
        if (status === 'responded' && response_message && currentContact.status !== 'responded') {
            setImmediate(async () => {
                try {
                    await sendResponseEmail(updatedContact, response_message);
                } catch (emailError) {
                    console.error('Failed to send response email:', emailError);
                }
            });
        }
        
        res.json({
            message: 'Contact updated successfully',
            contact: updatedContact,
            timestamp: new Date().toISOString(),
            info: status === 'responded' && response_message ? 'Response email will be sent to the contact' : undefined
        });
        
    } catch (error) {
        console.error('Error updating contact:', error);
        res.status(500).json({
            error: 'Internal server error',
            timestamp: new Date().toISOString()
        });
    }
});

// DELETE /api/contacts/:id - Delete contact
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query('DELETE FROM contacts WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Contact not found',
                timestamp: new Date().toISOString()
            });
        }
        
        res.json({
            message: 'Contact deleted successfully',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error deleting contact:', error);
        res.status(500).json({
            error: 'Internal server error',
            timestamp: new Date().toISOString()
        });
    }
});

export default router;
