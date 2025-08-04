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
                    COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_registrations,
                    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as new_this_week
                FROM registrations
            `),
            
            // Abstract stats
            pool.query(`
                SELECT 
                    COUNT(*) as total_abstracts,
                    COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_abstracts,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_abstracts,
                    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as new_this_week
                FROM abstracts
            `),
            
            // Review stats
            pool.query(`
                SELECT 
                    COUNT(*) as total_reviews,
                    AVG(score)::DECIMAL(3,2) as average_score,
                    COUNT(CASE WHEN recommendation = 'accept' THEN 1 END) as accept_recommendations,
                    COUNT(CASE WHEN recommendation = 'reject' THEN 1 END) as reject_recommendations
                FROM reviews
            `),
            
            // Contact stats
            pool.query(`
                SELECT 
                    COUNT(*) as total_contacts,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_contacts,
                    COUNT(CASE WHEN status = 'responded' THEN 1 END) as responded_contacts,
                    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as new_this_week
                FROM contacts
            `),
            
            // Session stats
            pool.query(`
                SELECT 
                    COUNT(*) as total_sessions,
                    COUNT(CASE WHEN session_type = 'keynote' THEN 1 END) as keynote_sessions,
                    COUNT(CASE WHEN session_type = 'presentation' THEN 1 END) as presentation_sessions
                FROM sessions
            `),
            
            // Speaker stats
            pool.query(`
                SELECT 
                    COUNT(*) as total_speakers,
                    COUNT(CASE WHEN keynote_speaker = true THEN 1 END) as keynote_speakers
                FROM speakers
            `)
        ]);

        const [regStats, absStats, revStats, conStats, sesStats, speStats] = statsQueries.map(q => q.rows[0]);

        res.json({
            dashboard: {
                registrations: {
                    total: parseInt(regStats.total_registrations),
                    confirmed: parseInt(regStats.confirmed_registrations),
                    newThisWeek: parseInt(regStats.new_this_week)
                },
                abstracts: {
                    total: parseInt(absStats.total_abstracts),
                    accepted: parseInt(absStats.accepted_abstracts),
                    pending: parseInt(absStats.pending_abstracts),
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
                    pending: parseInt(conStats.pending_contacts),
                    responded: parseInt(conStats.responded_contacts),
                    newThisWeek: parseInt(conStats.new_this_week)
                },
                sessions: {
                    total: parseInt(sesStats.total_sessions),
                    keynotes: parseInt(sesStats.keynote_sessions),
                    presentations: parseInt(sesStats.presentation_sessions)
                },
                speakers: {
                    total: parseInt(speStats.total_speakers),
                    keynotes: parseInt(speStats.keynote_speakers)
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
                SELECT 'registration' as type, id, first_name as name, last_name, email, created_at as activity_date
                FROM registrations 
                ORDER BY created_at DESC 
                LIMIT $1
            `, [limit / 4]),
            
            // Recent abstracts
            pool.query(`
                SELECT 'abstract' as type, id, title as name, '' as last_name, contact_email as email, created_at as activity_date
                FROM abstracts 
                ORDER BY created_at DESC 
                LIMIT $1
            `, [limit / 4]),
            
            // Recent contacts
            pool.query(`
                SELECT 'contact' as type, id, name, '' as last_name, email, created_at as activity_date
                FROM contacts 
                ORDER BY created_at DESC 
                LIMIT $1
            `, [limit / 4]),
            
            // Recent reviews
            pool.query(`
                SELECT 'review' as type, r.id, r.reviewer_email as name, '' as last_name, a.title as email, r.created_at as activity_date
                FROM reviews r
                JOIN abstracts a ON r.abstract_id = a.id
                ORDER BY r.created_at DESC 
                LIMIT $1
            `, [limit / 4])
        ]);
        
        // Combine and sort all activities
        const allActivities = activities
            .flat()
            .reduce((acc, curr) => acc.concat(curr.rows), [])
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
                SELECT 'contact' as type, id, name, email, subject, created_at as date
                FROM contacts 
                WHERE status = 'pending'
                ORDER BY created_at DESC
                LIMIT 10
            `),
            
            // Pending abstracts
            pool.query(`
                SELECT 'abstract' as type, id, title as name, contact_email as email, research_track as subject, created_at as date
                FROM abstracts 
                WHERE status = 'pending'
                ORDER BY created_at DESC
                LIMIT 10
            `),
            
            // Pending registrations
            pool.query(`
                SELECT 'registration' as type, id, first_name || ' ' || last_name as name, email, registration_type as subject, created_at as date
                FROM registrations 
                WHERE status = 'pending'
                ORDER BY created_at DESC
                LIMIT 10
            `)
        ]);

        const [pendingContacts, pendingAbstracts, pendingRegistrations] = pendingData.map(q => q.rows);
        
        res.json({
            pending: {
                contacts: pendingContacts,
                abstracts: pendingAbstracts,
                registrations: pendingRegistrations
            },
            counts: {
                contacts: pendingContacts.length,
                abstracts: pendingAbstracts.length,
                registrations: pendingRegistrations.length
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Pending items error:', error);
        res.status(500).json({ error: 'Failed to load pending items' });
    }
});

export default router;
