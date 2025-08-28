// backend/routes/admin.js
import express from 'express';
import { pool } from '../config/db.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Simple admin authentication middleware
const authenticateAdmin = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        req.admin = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Admin login (simplified - in production use proper authentication)
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // In production, hash passwords and store in database
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@ntlp-conference.org';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        
        if (email === adminEmail && password === adminPassword) {
            const token = jwt.sign(
                { id: 1, email: adminEmail, role: 'admin' },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '24h' }
            );
            
            res.json({
                message: 'Login successful',
                token,
                admin: { id: 1, email: adminEmail, role: 'admin' }
            });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Admin dashboard statistics
router.get('/dashboard', authenticateAdmin, async (req, res) => {
    try {
        // Get comprehensive statistics
        const statsQueries = await Promise.all([
            // Registration stats
            pool.query(`
                SELECT 
                    COUNT(*) as total_registrations,
                    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_registrations,
                    COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted_registrations,
                    COUNT(CASE WHEN status = 'under_review' THEN 1 END) as under_review_registrations,
                    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_registrations,
                    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL 7 DAY THEN 1 END) as new_this_week
                FROM registrations
            `),
            
            // Abstract stats
            pool.query(`
                SELECT 
                    COUNT(*) as total_abstracts,
                    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_abstracts,
                    COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted_abstracts,
                    COUNT(CASE WHEN status = 'under_review' THEN 1 END) as under_review_abstracts,
                    COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_abstracts,
                    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_abstracts,
                    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL 7 DAY THEN 1 END) as new_this_week
                FROM abstracts
            `),
            
            // Review stats
            pool.query(`
                SELECT 
                    COUNT(*) as total_reviews,
                    AVG(score) as average_score,
                    COUNT(CASE WHEN recommendation = 'accept' THEN 1 END) as accept_recommendations,
                    COUNT(CASE WHEN recommendation = 'reject' THEN 1 END) as reject_recommendations
                FROM reviews
            `),
            
            // Contact stats
            pool.query(`
                SELECT 
                    COUNT(*) as total_contacts,
                    COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted_contacts,
                    COUNT(CASE WHEN status = 'under_review' THEN 1 END) as under_review_contacts,
                    COUNT(CASE WHEN status = 'responded' THEN 1 END) as responded_contacts,
                    COUNT(CASE WHEN status = 'requires_followup' THEN 1 END) as requires_followup_contacts,
                    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL 7 DAY THEN 1 END) as new_this_week
                FROM contacts
            `),
            
            // Session stats
            pool.query(`
                SELECT 
                    COUNT(*) as total_sessions,
                    COUNT(CASE WHEN session_type = 'keynote' THEN 1 END) as keynote_sessions,
                    COUNT(CASE WHEN session_type = 'presentation' THEN 1 END) as presentation_sessions,
                    COUNT(CASE WHEN status = 'published' THEN 1 END) as published_sessions
                FROM sessions
            `),
            
            // Speaker stats
            pool.query(`
                SELECT 
                    COUNT(*) as total_speakers,
                    COUNT(CASE WHEN keynote_speaker = true THEN 1 END) as keynote_speakers,
                    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_speakers
                FROM speakers
            `),
            
            // Sponsorship stats
            pool.query(`
                SELECT 
                    COUNT(*) as total_sponsorships,
                    COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted_sponsorships,
                    COUNT(CASE WHEN status = 'under_review' THEN 1 END) as under_review_sponsorships,
                    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_sponsorships,
                    COUNT(CASE WHEN status = 'negotiating' THEN 1 END) as negotiating_sponsorships
                FROM sponsorships
            `)
        ]);

        const [regStats, absStats, revStats, conStats, sesStats, speStats, sponStats] = statsQueries.map(q => q[0]);

        res.json({
            dashboard: {
                registrations: {
                    total: parseInt(regStats.total_registrations),
                    approved: parseInt(regStats.approved_registrations),
                    submitted: parseInt(regStats.submitted_registrations),
                    underReview: parseInt(regStats.under_review_registrations),
                    rejected: parseInt(regStats.rejected_registrations),
                    newThisWeek: parseInt(regStats.new_this_week)
                },
                abstracts: {
                    total: parseInt(absStats.total_abstracts),
                    approved: parseInt(absStats.approved_abstracts),
                    submitted: parseInt(absStats.submitted_abstracts),
                    underReview: parseInt(absStats.under_review_abstracts),
                    accepted: parseInt(absStats.accepted_abstracts),
                    rejected: parseInt(absStats.rejected_abstracts),
                    newThisWeek: parseInt(absStats.new_this_week)
                },
                reviews: {
                    total: parseInt(revStats.total_reviews),
                    averageScore: parseFloat(revStats.average_score) || 0,
                    acceptRecommendations: parseInt(revStats.accept_recommendations),
                    rejectRecommendations: parseInt(revStats.reject_recommendations)
                },
                contacts: {
                    total: parseInt(conStats.total_contacts),
                    submitted: parseInt(conStats.submitted_contacts),
                    underReview: parseInt(conStats.under_review_contacts),
                    responded: parseInt(conStats.responded_contacts),
                    requiresFollowup: parseInt(conStats.requires_followup_contacts),
                    newThisWeek: parseInt(conStats.new_this_week)
                },
                sessions: {
                    total: parseInt(sesStats.total_sessions),
                    keynotes: parseInt(sesStats.keynote_sessions),
                    presentations: parseInt(sesStats.presentation_sessions),
                    published: parseInt(sesStats.published_sessions)
                },
                speakers: {
                    total: parseInt(speStats.total_speakers),
                    keynotes: parseInt(speStats.keynote_speakers),
                    approved: parseInt(speStats.approved_speakers)
                },
                sponsorships: {
                    total: parseInt(sponStats.total_sponsorships),
                    submitted: parseInt(sponStats.submitted_sponsorships),
                    underReview: parseInt(sponStats.under_review_sponsorships),
                    approved: parseInt(sponStats.approved_sponsorships),
                    negotiating: parseInt(sponStats.negotiating_sponsorships)
                }
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to load dashboard statistics' });
    }
});

// Get recent activity
router.get('/activity', authenticateAdmin, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        
        // Get recent activities from multiple tables
        const activities = await Promise.all([
            // Recent registrations
            pool.query(`
                SELECT 'registration' as type, id, first_name as name, last_name, email, status, created_at as activity_date
                FROM registrations 
                ORDER BY created_at DESC 
                LIMIT ?
            `, [Math.ceil(limit / 4)]),
            
            // Recent abstracts
            pool.query(`
                SELECT 'abstract' as type, id, title as name, '' as last_name, corresponding_author_email as email, status, created_at as activity_date
                FROM abstracts 
                ORDER BY created_at DESC 
                LIMIT ?
            `, [Math.ceil(limit / 4)]),
            
            // Recent contacts
            pool.query(`
                SELECT 'contact' as type, id, name, '' as last_name, email, status, created_at as activity_date
                FROM contacts 
                ORDER BY created_at DESC 
                LIMIT ?
            `, [Math.ceil(limit / 4)]),
            
            // Recent sponsorships
            pool.query(`
                SELECT 'sponsorship' as type, id, company_name as name, '' as last_name, email, status, created_at as activity_date
                FROM sponsorships 
                ORDER BY created_at DESC 
                LIMIT ?
            `, [Math.ceil(limit / 4)])
        ]);
        
        // Combine and sort all activities
        const allActivities = activities
            .flat()
            .reduce((acc, curr) => acc.concat(curr), [])
            .sort((a, b) => new Date(b.activity_date) - new Date(a.activity_date))
            .slice(0, limit);
        
        res.json({
            activities: allActivities,
            count: allActivities.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Activity feed error:', error);
        res.status(500).json({ error: 'Failed to load activity feed' });
    }
});

// Quick actions for pending items
router.get('/pending', authenticateAdmin, async (req, res) => {
    try {
        const pendingData = await Promise.all([
            // Pending contacts
            pool.query(`
                SELECT 'contact' as type, id, name, email, subject, status, priority, created_at as date
                FROM contacts 
                WHERE status IN ('submitted', 'under_review', 'requires_followup')
                ORDER BY 
                    CASE 
                        WHEN priority = 'urgent' THEN 1
                        WHEN priority = 'high' THEN 2
                        WHEN priority = 'normal' THEN 3
                        WHEN priority = 'low' THEN 4
                    END,
                    created_at DESC
                LIMIT 10
            `),
            
            // Pending abstracts
            pool.query(`
                SELECT 'abstract' as type, id, title as name, corresponding_author_email as email, track as subject, status, created_at as date
                FROM abstracts 
                WHERE status IN ('submitted', 'under_review', 'revision_required')
                ORDER BY created_at DESC
                LIMIT 10
            `),
            
            // Pending registrations
            pool.query(`
                SELECT 'registration' as type, id, CONCAT(first_name, ' ', last_name) as name, email, registration_type as subject, status, created_at as date
                FROM registrations 
                WHERE status IN ('submitted', 'under_review')
                ORDER BY created_at DESC
                LIMIT 10
            `),
            
            // Pending sponsorships
            pool.query(`
                SELECT 'sponsorship' as type, id, company_name as name, email, selected_package as subject, status, created_at as date
                FROM sponsorships 
                WHERE status IN ('submitted', 'under_review', 'negotiating')
                ORDER BY created_at DESC
                LIMIT 10
            `)
        ]);

        const [pendingContacts, pendingAbstracts, pendingRegistrations, pendingSponsorships] = pendingData.map(q => q);
        
        res.json({
            pending: {
                contacts: pendingContacts,
                abstracts: pendingAbstracts,
                registrations: pendingRegistrations,
                sponsorships: pendingSponsorships
            },
            counts: {
                contacts: pendingContacts.length,
                abstracts: pendingAbstracts.length,
                registrations: pendingRegistrations.length,
                sponsorships: pendingSponsorships.length
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Pending items error:', error);
        res.status(500).json({ error: 'Failed to load pending items' });
    }
});

// Get form submissions overview
router.get('/submissions', authenticateAdmin, async (req, res) => {
    try {
        const { form_type, status, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        
        let whereClause = 'WHERE 1=1';
        let params = [];
        
        if (form_type && form_type !== 'all') {
            whereClause += ' AND form_type = ?';
            params.push(form_type);
        }
        
        if (status && status !== 'all') {
            whereClause += ' AND status = ?';
            params.push(status);
        }
        
        // Get total count
        const [countResult] = await pool.query(
            `SELECT COUNT(*) as total FROM form_submissions ${whereClause}`,
            params
        );
        const total = countResult[0].total;
        
        // Get submissions with pagination
        const [submissions] = await pool.query(
            `SELECT * FROM form_submissions ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), offset]
        );
        
        // Get status distribution
        const [statusStats] = await pool.query(`
            SELECT status, COUNT(*) as count
            FROM form_submissions
            GROUP BY status
            ORDER BY count DESC
        `);
        
        // Get form type distribution
        const [typeStats] = await pool.query(`
            SELECT form_type, COUNT(*) as count
            FROM form_submissions
            GROUP BY form_type
            ORDER BY count DESC
        `);
        
        res.json({
            submissions,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            },
            statistics: {
                byStatus: statusStats,
                byType: typeStats
            }
        });
        
    } catch (error) {
        console.error('Submissions overview error:', error);
        res.status(500).json({ error: 'Failed to load submissions overview' });
    }
});

// Get admin actions log
router.get('/actions', authenticateAdmin, async (req, res) => {
    try {
        const { admin_id, entity_type, page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;
        
        let whereClause = 'WHERE 1=1';
        let params = [];
        
        if (admin_id) {
            whereClause += ' AND admin_id = ?';
            params.push(admin_id);
        }
        
        if (entity_type) {
            whereClause += ' AND entity_type = ?';
            params.push(entity_type);
        }
        
        // Get total count
        const [countResult] = await pool.query(
            `SELECT COUNT(*) as total FROM admin_actions ${whereClause}`,
            params
        );
        const total = countResult[0].total;
        
        // Get actions with pagination
        const [actions] = await pool.query(
            `SELECT * FROM admin_actions ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), offset]
        );
        
        res.json({
            actions,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
        
    } catch (error) {
        console.error('Admin actions error:', error);
        res.status(500).json({ error: 'Failed to load admin actions' });
    }
});

// Log admin action
const logAdminAction = async (adminId, actionType, entityType, entityId, actionDetails, req) => {
    try {
        await pool.query(`
            INSERT INTO admin_actions (
                admin_id, action_type, entity_type, entity_id, action_details, ip_address, user_agent, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
            adminId,
            actionType,
            entityType,
            entityId,
            JSON.stringify(actionDetails),
            req.ip || req.connection.remoteAddress,
            req.get('User-Agent')
        ]);
    } catch (error) {
        console.error('Error logging admin action:', error);
    }
};

// Bulk actions for form submissions
router.patch('/submissions/bulk', authenticateAdmin, async (req, res) => {
    try {
        const { ids, action, data } = req.body;
        
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'IDs array is required' });
        }
        
        if (!['approve', 'reject', 'mark_reviewed', 'assign_priority', 'add_notes'].includes(action)) {
            return res.status(400).json({ error: 'Invalid action' });
        }
        
        const placeholders = ids.map(() => '?').join(',');
        let updateQuery = '';
        let params = [];
        
        switch (action) {
            case 'approve':
                updateQuery = `UPDATE form_submissions SET status = 'approved', reviewed_at = NOW(), updated_at = NOW() WHERE id IN (${placeholders})`;
                params = ids;
                break;
            case 'reject':
                updateQuery = `UPDATE form_submissions SET status = 'rejected', reviewed_at = NOW(), updated_at = NOW() WHERE id IN (${placeholders})`;
                params = ids;
                break;
            case 'mark_reviewed':
                updateQuery = `UPDATE form_submissions SET status = 'under_review', reviewed_at = NOW(), updated_at = NOW() WHERE id IN (${placeholders})`;
                params = ids;
                break;
            case 'assign_priority':
                if (!data.priority) {
                    return res.status(400).json({ error: 'Priority is required for assign_priority action' });
                }
                updateQuery = `UPDATE form_submissions SET admin_notes = JSON_SET(COALESCE(admin_notes, '{}'), '$.priority', ?), updated_at = NOW() WHERE id IN (${placeholders})`;
                params = [data.priority, ...ids];
                break;
            case 'add_notes':
                if (!data.notes) {
                    return res.status(400).json({ error: 'Notes are required for add_notes action' });
                }
                updateQuery = `UPDATE form_submissions SET admin_notes = JSON_SET(COALESCE(admin_notes, '{}'), '$.notes', ?), updated_at = NOW() WHERE id IN (${placeholders}) WHERE id IN (${placeholders})`;
                params = [data.notes, ...ids];
                break;
        }
        
        const [result] = await pool.query(updateQuery, params);
        
        // Log admin action
        await logAdminAction(req.admin.id, `bulk_${action}`, 'form_submissions', null, { ids, action, data }, req);
        
        res.json({
            message: `${result.affectedRows} submissions updated successfully`,
            updatedCount: result.affectedRows
        });
        
    } catch (error) {
        console.error('Bulk submissions action error:', error);
        res.status(500).json({ error: 'Failed to perform bulk action' });
    }
});

export default router;
