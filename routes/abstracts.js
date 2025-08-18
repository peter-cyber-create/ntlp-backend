// backend/routes/abstracts.js
import express from 'express';
import { pool } from '../config/db.js';
import { validateAbstract, validateAbstractStatus } from '../middleware/validation.js';

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
  'Health professionals’ education including transformative teaching methods and competency-based training',
];

// Endpoint to get tracks and topics for frontend
router.get('/tracks', (req, res) => {
  res.json({ tracks: TRACKS, crossCuttingThemes: CROSS_CUTTING_THEMES });
});

const router = express.Router();

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


    const result = await pool.query(
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
      ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *`,
      [
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
        'submitted'
      ]
    );

    res.status(201).json({
      message: 'Abstract submitted successfully',
      abstract: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating abstract:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// READ - Get all abstracts (with filtering)
router.get('/', async (req, res) => {
  try {
    const { 
      status, 
      track, 
      submission_type, 
      search,
      page = 1, 
      limit = 20 
    } = req.query;

    let query = `
      SELECT a.*, 
        COUNT(*) OVER() as total_count
      FROM abstracts a
    `;
    let params = [];
    const conditions = [];

    // If no status filter is provided, default to showing all except deleted/archived (if such statuses exist)
    if (status) {
      conditions.push(`a.status = $${params.length + 1}`);
      params.push(status);
    } else {
      // Show all abstracts, including 'submitted', unless you want to exclude certain statuses
      // If you want to exclude deleted/archived, add: conditions.push(`a.status != 'deleted' AND a.status != 'archived'`);
    }

    if (track) {
      conditions.push(`a.track = $${params.length + 1}`);
      params.push(track);
    }

    if (submission_type) {
      conditions.push(`a.submission_type = $${params.length + 1}`);
      params.push(submission_type);
    }

    if (search) {
      conditions.push(`(a.title ILIKE $${params.length + 1} OR a.abstract ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ` ORDER BY a.created_at DESC 
               LIMIT $${params.length + 1} 
               OFFSET $${params.length + 2}`;
    
    params.push(parseInt(limit));
    params.push((parseInt(page) - 1) * parseInt(limit));

    const result = await pool.query(query, params);
    
    const totalCount = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      abstracts: result.rows.map(row => {
        const { total_count, ...abstract } = row;
        return abstract;
      }),
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching abstracts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// READ - Get abstract by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
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
      WHERE a.id = $1
      GROUP BY a.id
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Abstract not found' });
    }
    
    res.json(result.rows[0]);
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
      file_url,
      status
    } = req.body;

    const result = await pool.query(
      `UPDATE abstracts SET 
        title = $1,
        abstract = $2,
        keywords = $3,
        authors = $4,
        corresponding_author_email = $5,
        submission_type = $6,
        track = $7,
        file_url = $8,
        status = $9,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $10 RETURNING *`,
      [
        title,
        abstract,
        JSON.stringify(keywords || []),
        JSON.stringify(authors),
        corresponding_author_email,
        submission_type,
        track,
        file_url,
        status,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Abstract not found' });
    }

    res.json({
      message: 'Abstract updated successfully',
      abstract: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating abstract:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// BULK ACTIONS - Update multiple abstracts status (must be before parameterized routes)
router.patch('/bulk/status', async (req, res) => {
  try {
    const { ids, status, reviewer_comments } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'IDs array is required' });
    }

    if (!['submitted', 'under_review', 'accepted', 'rejected', 'revision_required'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const placeholders = ids.map((_, index) => `$${index + 1}`).join(',');
    const params = [...ids, status, reviewer_comments || null];

    const result = await pool.query(
      `UPDATE abstracts SET 
        status = $${ids.length + 1},
        reviewer_comments = $${ids.length + 2},
        updated_at = CURRENT_TIMESTAMP
      WHERE id IN (${placeholders}) RETURNING *`,
      params
    );

    res.json({
      message: `${result.rows.length} abstracts updated successfully`,
      updated: result.rows
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

    const placeholders = ids.map((_, index) => `$${index + 1}`).join(',');
    
    const result = await pool.query(
      `DELETE FROM abstracts WHERE id IN (${placeholders}) RETURNING *`,
      ids
    );

    res.json({
      message: `${result.rows.length} abstracts deleted successfully`,
      deleted: result.rows
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
    const { status, reviewer_comments } = req.body;

    if (!['submitted', 'under_review', 'accepted', 'rejected', 'revision_required'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await pool.query(
      `UPDATE abstracts SET 
        status = $1,
        reviewer_comments = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 RETURNING *`,
      [status, reviewer_comments, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Abstract not found' });
    }

    res.json({
      message: `Abstract status updated to ${status}`,
      abstract: result.rows[0]
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
    await pool.query('DELETE FROM reviews WHERE abstract_id = $1', [id]);
    
    // Then delete the abstract
    const result = await pool.query('DELETE FROM abstracts WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Abstract not found' });
    }
    
    res.json({ 
      message: 'Abstract deleted successfully', 
      deleted: result.rows[0] 
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

    const result = await pool.query(
      'SELECT * FROM abstracts WHERE track = $1 AND status = $2 ORDER BY title ASC',
      [track, status]
    );

    res.json({
      track,
      count: result.rows.length,
      abstracts: result.rows
    });
  } catch (error) {
    console.error('Error fetching abstracts by track:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get submission statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_submissions,
        COUNT(*) FILTER (WHERE status = 'submitted') as submitted,
        COUNT(*) FILTER (WHERE status = 'under_review') as under_review,
        COUNT(*) FILTER (WHERE status = 'accepted') as accepted,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
        COUNT(*) FILTER (WHERE status = 'revision_required') as revision_required,
        COUNT(*) FILTER (WHERE submission_type = 'abstract') as abstracts,
        COUNT(*) FILTER (WHERE submission_type = 'full_paper') as full_papers,
        COUNT(*) FILTER (WHERE submission_type = 'poster') as posters
      FROM abstracts
    `);

    const trackStats = await pool.query(`
      SELECT track, COUNT(*) as count
      FROM abstracts
      WHERE track IS NOT NULL
      GROUP BY track
      ORDER BY count DESC
    `);

    res.json({
      overview: stats.rows[0],
      by_track: trackStats.rows
    });
  } catch (error) {
    console.error('Error fetching submission statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
