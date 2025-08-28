// backend/routes/abstracts.js
import express from 'express';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  port: 3306,
  database: 'ntlp_conference',
  user: 'root',
  password: 'toor',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
import { validateAbstract, validateAbstractStatus } from '../middleware/validation.js';

const router = express.Router();

// Manual payment instructions endpoint (must be after router is declared)

router.get('/payment-info', (req, res) => {
  res.json({
    instructions: `To complete your registration, please make a payment to the following account and upload your proof of payment in your profile or email it to the conference organizers.`,
    account_details: {
      bank_name: 'Example Bank Ltd.',
      account_name: 'NCD Conference Organizing Committee',
      account_number: '1234567890',
      branch: 'Gulu City',
      swift_code: 'EXAMPLExx',
      currency: 'UGX',
      note: 'Include your full name and registration ID as payment reference.'
    },
    contact: {
      phone: '+256772524474',
      email: 'david.kitara@gu.ac.ug'
    }
  });
});

// Conference tracks and subcategories/topics
const TRACKS = [
  {
    name: 'Integrated Diagnostics, AMR, and Epidemic Readiness',
    value: 'track_1',
    topics: [
      'Optimizing Laboratory Diagnostics in Integrated Health Systems',
      'Quality management systems in Multi-Disease Diagnostics',
      'Leveraging Point-of-Care Testing to Enhance Integrated Service Delivery',
      'Combatting Antimicrobial Resistance (AMR) Through Diagnostics',
      'Strengthening surveillance systems for drug resistance across TB, malaria, HIV, and bacterial infections',
      'Linking diagnostics to resistance monitoring: From lab to real-time policy response',
      'Role of Diagnostics in Early Warning Systems: lessons from recent outbreaks',
      'Expanding access to radiological services: Affordable imaging in low-resource settings',
    ],
  },
  {
    name: 'Digital Health, Data, and Innovation',
    value: 'track_2',
    topics: [
      'AI-powered diagnostics: Innovations and governance for TB, HIV, and cervical cancer',
      'Digital platforms for surveillance, early detection, and outbreak prediction',
      'Data interoperability and health information exchange: service delivery Integration and data/information systems, Gaps, ethics, and governance',
      'Community-led digital health: Mobile tools, and digital village health teams (VHTs)',
      'Localized health information systems: Capturing/collection, use of data at grass root and higher levels for fast action.',
      'Leveraging digital equity in urban and peri-urban health responses',
    ],
  },
  {
    name: 'Community Engagement for Disease Prevention and Elimination',
    value: 'track_3',
    topics: [
      'Catalyzing youth, community health extension workers (CHEWs), and grassroots champions for health innovation',
      'Integrating preventive services for communicable and non-communicable diseases, and mental health at household level',
      'Scaling community-led elimination efforts: Malaria, TB, neglected tropical diseases (NTDs), and leprosy and improving vaccine uptake',
      'Participatory planning, implementation, monitoring for behavior change, and social accountability',
    ],
  },
  {
    name: 'Health System Resilience and Emergency Preparedness and Response',
    value: 'track_4',
    topics: [
      'Sepsis and emergency triage protocols in fragile health systems',
      'Strengthening infection prevention and control (IPC) in primary care; including ready to use isolation facilities.',
      'Local vaccine and therapeutics; access, and emergency stockpiling',
      'Health workforce preparedness; Training multidisciplinary rapid response teams',
      'Continuity of care: Protecting essential health services during crises',
    ],
  },
  {
    name: 'Policy, Financing and Cross-Sector Integration',
    value: 'track_5',
    topics: [
      'Integrated financing models for chronic and infectious disease burdens',
      'Social determinant-sensitive policymaking: Urban health, empowering young people for improved health through education and intersectoral action',
      'National accountability frameworks for health performance',
      'Scaling UHC through service integration at the primary level',
      'Policy instruments for embedding health equity in national planning',
      'Implementation science and translation of results into policy',
    ],
  },
  {
    name: 'One Health',
    value: 'track_6',
    topics: [
      'Early warning systems and multi-sector coordination for zoonotic outbreaks',
      'Localizing One Health strategies: Successes and challenges at district level',
      'Public–private partnerships; Insurance, vouchers, and demand-side financing to reduce out-of-pocket expenditure',
      'Data harmonization between human and animal health sectors',
      'Nutrition and lifestyle for health',
      'Wildlife trade, food systems, and emerging health risks',
      'Preparing for climate-sensitive disease patterns and spillover threats',
      'Strengthening Biosafety and Biosecurity Systems to Prevent Zoonotic Spillovers',
      'Confronting Insecticide Resistance in Vectors: A One Health approach to sustaining vector control gains',
    ],
  },
  {
    name: 'Care, Treatment & Rehabilitation',
    value: 'track_7',
    topics: [
      'Innovations in equitable health services for acute and chronic diseases care delivery across primary levels',
      'Interface of communicable and non-communicable diseases (NCDs): Integrated models',
      'Role of traditional medicine in continuum of care',
      'Enhancing community trust and treatment adherence through culturally embedded care',
      'Digital decision-support tools for frontline clinicians in NCD and infectious disease management',
    ],
  },
];

const CROSS_CUTTING_THEMES = [
  'Health equity and inclusion in marginalized and urbanizing populations',
  'Urban health, infrastructure, and health service delivery adaptations',
  'Gender and youth empowerment in policy and practice',
  'Evidence translation from research to policy implementation',
  'South-South collaboration and regional leadership in innovation',
  'Health professionals education including transformative teaching methods and competency-based training',
];

// Endpoint to get tracks and topics for frontend
router.get('/tracks', (req, res) => {
  res.json({ tracks: TRACKS, crossCuttingThemes: CROSS_CUTTING_THEMES });
});

// CREATE abstract/paper submission
router.post('/', validateAbstract, async (req, res) => {
  try {
    const {
      title,
      abstract,
      keywords,
      authors,
      corresponding_author_email,
      submission_type,
      track,
      subcategory, // new field for topic/subcategory
      cross_cutting_themes = [], // optional
      file_url,
      submitted_by,
      format // oral or poster
    } = req.body;

    // Validate required fields
    if (!title || !abstract || !authors || !corresponding_author_email || !track || !subcategory || !format) {
      return res.status(400).json({ 
        error: 'Title, abstract, authors, corresponding author email, track, subcategory, and format are required' 
      });
    }

    // Validate track and subcategory
    const trackObj = TRACKS.find(t => t.value === track || t.name === track);
    if (!trackObj) {
      return res.status(400).json({ error: 'Invalid track' });
    }
    if (!trackObj.topics.includes(subcategory)) {
      return res.status(400).json({ error: 'Invalid subcategory for selected track' });
    }

    // Validate abstract structure (Background, Methods, Findings, Conclusion)
    const structureRegex = /(Background:|BACKGROUND:)[\s\S]*?(Methods:|METHODS:)[\s\S]*?(Findings:|FINDINGS:)[\s\S]*?(Conclusion:|CONCLUSION:)/;
    if (!structureRegex.test(abstract)) {
      return res.status(400).json({ error: 'Abstract must include Background, Methods, Findings, and Conclusion sections.' });
    }

    // Validate word count (max 300 words)
    const wordCount = abstract.trim().split(/\s+/).length;
    if (wordCount > 300) {
      return res.status(400).json({ error: 'Abstract must not exceed 300 words.' });
    }

    const insertQuery =
      `INSERT INTO abstracts(
        title,
        abstract,
        keywords,
        authors,
        corresponding_author_email,
        submission_type,
        track,
        subcategory,
        cross_cutting_themes,
        file_url,
        submitted_by,
        format,
        status,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`;

    const [result] = await pool.query(insertQuery, [
      title,
      abstract,
      JSON.stringify(keywords || []),
      JSON.stringify(authors),
      corresponding_author_email,
      submission_type || 'abstract',
      track,
      subcategory,
      JSON.stringify(cross_cutting_themes),
      file_url,
      submitted_by,
      format,
    ]);

    // Create form submission record
    await pool.query(`
      INSERT INTO form_submissions (
        form_type, entity_id, submitted_by, submission_data, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'submitted', NOW(), NOW())
    `, [
      'abstract',
      result.insertId,
      corresponding_author_email,
      JSON.stringify(req.body)
    ]);

    // Fetch the inserted row
    const [rows] = await pool.query('SELECT * FROM abstracts WHERE id = ?', [result.insertId]);
    res.status(201).json({
      message: 'Abstract submitted successfully and is under review',
      abstract: rows[0],
      status: 'submitted'
    });
  } catch (error) {
    console.error('Error creating abstract:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// READ - Get abstract by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query(`
      SELECT a.*, 
        COALESCE(
          json_agg(
            json_build_object(
              'id', r.id,
              'reviewer_name', r.reviewer_name,
              'reviewer_email', r.reviewer_email,
              'score', r.score,
              'comments', r.comments,
              'recommendation', r.recommendation,
              'created_at', r.created_at
            )
          ) FILTER (WHERE r.id IS NOT NULL), 
          '[]'::json
        ) as reviews
      FROM abstracts a
      LEFT JOIN reviews r ON a.id = r.abstract_id
      WHERE a.id = ?
      GROUP BY a.id
    `, [id]);
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Abstract not found' });
    }
    
    res.json(result[0]);
  } catch (error) {
    console.error('Error fetching abstract:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// UPDATE abstract
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      abstract,
      keywords,
      authors,
      corresponding_author_email,
      submission_type,
      track,
      subcategory,
      cross_cutting_themes,
      file_url,
      status
    } = req.body;

    const result = await pool.query(
      `UPDATE abstracts SET 
        title = ?,
        abstract = ?,
        keywords = ?,
        authors = ?,
        corresponding_author_email = ?,
        submission_type = ?,
        track = ?,
        subcategory = ?,
        cross_cutting_themes = ?,
        file_url = ?,
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        title,
        abstract,
        JSON.stringify(keywords || []),
        JSON.stringify(authors),
        corresponding_author_email,
        submission_type,
        track,
        subcategory,
        JSON.stringify(cross_cutting_themes || []),
        file_url,
        status,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Abstract not found' });
    }

    res.json({
      message: 'Abstract updated successfully',
      abstract: { id, ...req.body }
    });
  } catch (error) {
    console.error('Error updating abstract:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// BULK ACTIONS - Update multiple abstracts status (must be before parameterized routes)
router.patch('/bulk/status', async (req, res) => {
  try {
    const { ids, status, admin_notes, review_comments } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'IDs array is required' });
    }

    if (!['submitted', 'under_review', 'accepted', 'rejected', 'revision_required', 'approved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const placeholders = ids.map(() => '?').join(',');
    const params = [...ids, status, admin_notes || null, review_comments || null];

    const result = await pool.query(
      `UPDATE abstracts SET 
        status = ?,
        admin_notes = ?,
        reviewer_comments = ?,
        updated_at = CURRENT_TIMESTAMP
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
      WHERE form_type = 'abstract' AND entity_id IN (${placeholders})`,
      params
    );

    res.json({
      message: `${result.affectedRows} abstracts updated successfully`,
      updated: result.affectedRows
    });
  } catch (error) {
    console.error('Error bulk updating abstracts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// BULK ACTIONS - Delete multiple abstracts (must be before parameterized routes)
router.delete('/bulk', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'IDs array is required' });
    }

    const placeholders = ids.map(() => '?').join(',');
    
    const result = await pool.query(
      `DELETE FROM abstracts WHERE id IN (${placeholders})`,
      ids
    );

    res.json({
      message: `${result.affectedRows} abstracts deleted successfully`,
      deleted: result.affectedRows
    });
  } catch (error) {
    console.error('Error bulk deleting abstracts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// UPDATE abstract status (for review process)
router.patch('/:id/status', validateAbstractStatus, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes, review_comments } = req.body;

    if (!['submitted', 'under_review', 'accepted', 'rejected', 'revision_required', 'approved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await pool.query(
      `UPDATE abstracts SET 
        status = ?,
        admin_notes = ?,
        reviewer_comments = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [status, admin_notes, review_comments, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Abstract not found' });
    }

    // Update form submission status
    await pool.query(`
      UPDATE form_submissions SET 
        status = ?, 
        admin_notes = ?, 
        review_comments = ?,
        reviewed_at = NOW(),
        updated_at = NOW()
      WHERE form_type = 'abstract' AND entity_id = ?
    `, [status, admin_notes, review_comments, id]);

    res.json({
      message: `Abstract status updated to ${status}`,
      abstract: { id, status, admin_notes, review_comments }
    });
  } catch (error) {
    console.error('Error updating abstract status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE abstract
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // First delete associated reviews
    await pool.query('DELETE FROM reviews WHERE abstract_id = ?', [id]);
    
    // Then delete the abstract
    const result = await pool.query('DELETE FROM abstracts WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Abstract not found' });
    }
    
    res.json({ 
      message: 'Abstract deleted successfully', 
      deleted: { id }
    });
  } catch (error) {
    console.error('Error deleting abstract:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get abstracts by track for program scheduling
router.get('/track/:track', async (req, res) => {
  try {
    const { track } = req.params;
    const { status = 'accepted' } = req.query;

    const [result] = await pool.query(
      'SELECT * FROM abstracts WHERE track = ? AND status = ? ORDER BY title ASC',
      [track, status]
    );

    res.json({
      track,
      count: result.length,
      abstracts: result
    });
  } catch (error) {
    console.error('Error fetching abstracts by track:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all abstracts with filtering and pagination (admin)
router.get('/', async (req, res) => {
  try {
    const { 
      status, 
      track, 
      search, 
      page = 1, 
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    let params = [];
    
    if (status && status !== 'all') {
      whereClause += ' AND status = ?';
      params.push(status);
    }
    
    if (track && track !== 'all') {
      whereClause += ' AND track = ?';
      params.push(track);
    }
    
    if (search) {
      whereClause += ' AND (title LIKE ? OR abstract LIKE ? OR corresponding_author_email LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    // Validate sort parameters
    const allowedSortFields = ['created_at', 'updated_at', 'title', 'status', 'track'];
    const allowedSortOrders = ['ASC', 'DESC'];
    
    if (!allowedSortFields.includes(sortBy)) sortBy = 'created_at';
    if (!allowedSortOrders.includes(sortOrder.toUpperCase())) sortOrder = 'DESC';
    
    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM abstracts ${whereClause}`,
      params
    );
    const total = countResult[0].total;
    
    // Get abstracts with pagination
    const [abstracts] = await pool.query(
      `SELECT * FROM abstracts ${whereClause} ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    
    res.json({
      abstracts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching abstracts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get submission statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_submissions,
        COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted,
        COUNT(CASE WHEN status = 'under_review' THEN 1 END) as under_review,
        COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN status = 'revision_required' THEN 1 END) as revision_required,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN submission_type = 'abstract' THEN 1 END) as abstracts,
        COUNT(CASE WHEN submission_type = 'full_paper' THEN 1 END) as full_papers,
        COUNT(CASE WHEN submission_type = 'poster' THEN 1 END) as posters
      FROM abstracts
    `);

    const [trackStats] = await pool.query(`
      SELECT track, COUNT(*) as count
      FROM abstracts
      WHERE track IS NOT NULL
      GROUP BY track
      ORDER BY count DESC
    `);

    res.json({
      overview: stats[0],
      by_track: trackStats
    });
  } catch (error) {
    console.error('Error fetching submission statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
