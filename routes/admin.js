// backend/routes/admin.js
import express from 'express';
import { pool } from '../config/db.js';
import jwt from 'jsonwebtoken';
import { authenticateAdmin, logAdminAction, logSecurityEvent } from '../middleware/auth.js';
import { hashPassword, comparePassword, validatePassword } from '../middleware/auth.js';
import logger from '../config/logger.js';

const router = express.Router();

// Admin login with enhanced security
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Rate limiting for login attempts
    const clientIp = req.ip || req.connection.remoteAddress;
    const loginAttempts = await getLoginAttempts(clientIp);
    
    if (loginAttempts.count >= 5 && loginAttempts.lastAttempt > Date.now() - (15 * 60 * 1000)) {
      logSecurityEvent('login_rate_limit_exceeded', req, { ip: clientIp, attempts: loginAttempts.count });
      return res.status(429).json({ 
        error: 'Too many login attempts. Please try again in 15 minutes.',
        retryAfter: Math.ceil((15 * 60 * 1000 - (Date.now() - loginAttempts.lastAttempt)) / 1000)
      });
    }
    
    // Get admin from database
    const [adminRows] = await pool.query(
      'SELECT id, email, password_hash, role, status, last_login FROM admins WHERE email = ? AND status = ?',
      [email, 'active']
    );
    
    if (adminRows.length === 0) {
      await recordLoginAttempt(clientIp, false);
      logSecurityEvent('login_failed_invalid_credentials', req, { email, ip: clientIp });
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const admin = adminRows[0];
    
    // Verify password
    const isValidPassword = await comparePassword(password, admin.password_hash);
    
    if (!isValidPassword) {
      await recordLoginAttempt(clientIp, false);
      logSecurityEvent('login_failed_invalid_password', req, { email, ip: clientIp });
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Clear failed login attempts
    await clearLoginAttempts(clientIp);
    
    // Update last login
    await pool.query(
      'UPDATE admins SET last_login = NOW() WHERE id = ?',
      [admin.id]
    );
    
    // Generate JWT token
            const token = jwt.sign(
      { 
        id: admin.id, 
        email: admin.email, 
        role: admin.role 
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        issuer: 'ntlp-backend',
        audience: 'ntlp-admin'
      }
    );
    
    // Log successful login
    logSecurityEvent('login_successful', req, { adminId: admin.id, email: admin.email, ip: clientIp });
            
            res.json({
                message: 'Login successful',
                token,
      admin: { 
        id: admin.id, 
        email: admin.email, 
        role: admin.role,
        lastLogin: admin.last_login
      }
    });
    
    } catch (error) {
    logger.error('Admin login error:', error, req);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Admin dashboard statistics with enhanced error handling
router.get('/dashboard', authenticateAdmin, async (req, res) => {
    try {
    const startTime = Date.now();
    
        // Get comprehensive statistics from existing tables only
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
            
            // Contact stats
            pool.query(`
                SELECT 
                    COUNT(*) as total_contacts,
                    COUNT(CASE WHEN status = 'new' THEN 1 END) as submitted_contacts,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as under_review_contacts,
                    COUNT(CASE WHEN status = 'resolved' THEN 1 END) as responded_contacts,
                    COUNT(CASE WHEN status = 'in-progress' THEN 1 END) as requires_followup_contacts,
          COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL 7 DAY THEN 1 END) as new_this_week
                FROM contacts
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

    const [regStats, absStats, conStats, sponStats] = statsQueries.map(q => q.rows[0]);
    const duration = Date.now() - startTime;

    // Log dashboard access
    logAdminAction(req.admin.id, 'dashboard_access', 'dashboard', null, req, { duration });

        res.json({
            dashboard: {
                registrations: {
                    total: regStats.total_registrations || 0,
                    approved: regStats.approved_registrations || 0,
                    submitted: regStats.submitted_registrations || 0,
                    underReview: regStats.under_review_registrations || 0,
                    rejected: regStats.rejected_registrations || 0,
                    newThisWeek: regStats.new_this_week || 0
                },
                abstracts: {
                    total: absStats.total_abstracts || 0,
                    approved: absStats.approved_abstracts || 0,
                    submitted: absStats.submitted_abstracts || 0,
                    underReview: absStats.under_review_abstracts || 0,
                    accepted: absStats.accepted_abstracts || 0,
                    rejected: absStats.rejected_abstracts || 0,
                    newThisWeek: absStats.new_this_week || 0
                },
                reviews: {
                    total: 0,
                    averageScore: 0,
                    acceptRecommendations: 0,
                    rejectRecommendations: 0
                },
                contacts: {
                    total: conStats.total_contacts || 0,
                    submitted: conStats.submitted_contacts || 0,
                    underReview: conStats.under_review_contacts || 0,
                    responded: conStats.responded_contacts || 0,
                    requiresFollowup: conStats.requires_followup_contacts || 0,
                    newThisWeek: conStats.new_this_week || 0
                },
                sessions: {
                    total: 0,
                    keynotes: 0,
                    presentations: 0,
                    published: 0
                },
                speakers: {
                    total: 0,
                    keynotes: 0,
                    approved: 0
                },
                sponsorships: {
                    total: sponStats.total_sponsorships || 0,
                    submitted: sponStats.submitted_sponsorships || 0,
                    underReview: sponStats.under_review_sponsorships || 0,
                    approved: sponStats.approved_sponsorships || 0,
                    negotiating: sponStats.negotiating_sponsorships || 0
                }
            },
      timestamp: new Date().toISOString(),
      performance: {
        duration: `${duration}ms`
      }
        });
        
    } catch (error) {
    logger.error('Dashboard stats error:', error, req);
        res.status(500).json({ error: 'Failed to load dashboard statistics' });
    }
});

// Get recent activity with pagination
router.get('/activity', authenticateAdmin, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
        
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
      .reduce((acc, curr) => acc.concat(curr.rows), [])
            .sort((a, b) => new Date(b.activity_date) - new Date(a.activity_date))
      .slice(offset, offset + limit);
    
    // Log activity access
    logAdminAction(req.admin.id, 'activity_access', 'activity', null, req, { limit, page });
        
        res.json({
            activities: allActivities,
            count: allActivities.length,
      pagination: {
        page,
        limit,
        total: allActivities.length
      },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
    logger.error('Activity feed error:', error, req);
        res.status(500).json({ error: 'Failed to load activity feed' });
    }
});

// Get pending items with priority sorting
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

    const [pendingContacts, pendingAbstracts, pendingRegistrations, pendingSponsorships] = pendingData.map(q => q.rows);
    
    // Log pending items access
    logAdminAction(req.admin.id, 'pending_items_access', 'pending', null, req);
        
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
    logger.error('Pending items error:', error, req);
        res.status(500).json({ error: 'Failed to load pending items' });
    }
});

// Get form submissions overview with enhanced filtering
router.get('/submissions', authenticateAdmin, async (req, res) => {
    try {
    const { form_type, status, page = 1, limit = 20, date_from, date_to } = req.query;
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
    
    if (date_from) {
      whereClause += ' AND created_at >= ?';
      params.push(date_from);
    }
    
    if (date_to) {
      whereClause += ' AND created_at <= ?';
      params.push(date_to);
    }
        
        // Get total count
        const [countResult] = await pool.query(
            `SELECT COUNT(*) as total FROM form_submissions ${whereClause}`,
            params
        );
    const total = parseInt(countResult.rows[0].total);
        
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
    
    // Log submissions access
    logAdminAction(req.admin.id, 'submissions_access', 'submissions', null, req, { 
      filters: { form_type, status, date_from, date_to },
      pagination: { page, limit }
    });
        
        res.json({
      submissions: submissions.rows,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            },
            statistics: {
        byStatus: statusStats.rows,
        byType: typeStats.rows
            }
        });
        
    } catch (error) {
    logger.error('Submissions overview error:', error, req);
        res.status(500).json({ error: 'Failed to load submissions overview' });
    }
});

// Bulk actions for form submissions with enhanced security
router.patch('/submissions/bulk', authenticateAdmin, async (req, res) => {
    try {
        const { ids, action, data } = req.body;
        
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'IDs array is required' });
        }
        
        if (!['approve', 'reject', 'mark_reviewed', 'assign_priority', 'add_notes'].includes(action)) {
            return res.status(400).json({ error: 'Invalid action' });
        }
    
    // Limit bulk operations to prevent abuse
    if (ids.length > 100) {
      return res.status(400).json({ error: 'Cannot process more than 100 items at once' });
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
        updateQuery = `UPDATE form_submissions SET admin_notes = JSON_SET(COALESCE(admin_notes, '{}'), '$.notes', ?), updated_at = NOW() WHERE id IN (${placeholders})`;
                params = [data.notes, ...ids];
                break;
        }
        
        const [result] = await pool.query(updateQuery, params);
        
        // Log admin action
    logAdminAction(req.admin.id, `bulk_${action}`, 'form_submissions', null, req, { 
      ids, 
      action, 
      data, 
      affectedRows: result.rowCount 
    });
        
        res.json({
      message: `${result.rowCount} submissions updated successfully`,
      updatedCount: result.rowCount
        });
        
    } catch (error) {
    logger.error('Bulk submissions action error:', error, req);
        res.status(500).json({ error: 'Failed to perform bulk action' });
    }
});

// Helper functions for login security
async function getLoginAttempts(ip) {
  try {
    const [result] = await pool.query(
      'SELECT COUNT(*) as count, MAX(attempted_at) as last_attempt FROM login_attempts WHERE ip_address = ? AND attempted_at > NOW() - INTERVAL 15 MINUTE',
      [ip]
    );
    return {
      count: parseInt(result.rows[0].count),
      lastAttempt: result.rows[0].last_attempt ? new Date(result.rows[0].last_attempt).getTime() : 0
    };
  } catch (error) {
    logger.error('Error getting login attempts:', error);
    return { count: 0, lastAttempt: 0 };
  }
}

async function recordLoginAttempt(ip, success) {
  try {
    await pool.query(
      'INSERT INTO login_attempts (ip_address, success, attempted_at) VALUES (?, ?, NOW())',
      [ip, success]
    );
  } catch (error) {
    logger.error('Error recording login attempt:', error);
  }
}

async function clearLoginAttempts(ip) {
  try {
    await pool.query(
      'DELETE FROM login_attempts WHERE ip_address = ?',
      [ip]
    );
  } catch (error) {
    logger.error('Error clearing login attempts:', error);
  }
}

export default router;
