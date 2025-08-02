// backend/routes/reviews.js
import express from 'express';
import { pool } from '../config/db.js';
import { validateReview } from '../middleware/validation.js';

const router = express.Router();

// CREATE review for an abstract
router.post('/', validateReview, async (req, res) => {
  try {
    const {
      abstract_id,
      reviewer_name,
      reviewer_email,
      score,
      comments,
      recommendation,
      detailed_feedback
    } = req.body;

    // Validate required fields
    if (!abstract_id || !reviewer_name || !reviewer_email || !score || !recommendation) {
      return res.status(400).json({ 
        error: 'Abstract ID, reviewer name, email, score, and recommendation are required' 
      });
    }

    // Validate score range
    if (score < 1 || score > 10) {
      return res.status(400).json({ error: 'Score must be between 1 and 10' });
    }

    // Check if abstract exists
    const abstractExists = await pool.query(
      'SELECT id FROM abstracts WHERE id = $1',
      [abstract_id]
    );

    if (abstractExists.rows.length === 0) {
      return res.status(404).json({ error: 'Abstract not found' });
    }

    // Check if reviewer has already reviewed this abstract
    const existingReview = await pool.query(
      'SELECT id FROM reviews WHERE abstract_id = $1 AND reviewer_email = $2',
      [abstract_id, reviewer_email]
    );

    if (existingReview.rows.length > 0) {
      return res.status(400).json({ error: 'You have already reviewed this abstract' });
    }

    const result = await pool.query(
      `INSERT INTO reviews(
        abstract_id, 
        reviewer_name, 
        reviewer_email, 
        score, 
        comments, 
        recommendation,
        detailed_feedback,
        created_at,
        updated_at
      ) VALUES($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *`,
      [abstract_id, reviewer_name, reviewer_email, score, comments, recommendation, JSON.stringify(detailed_feedback || {})]
    );

    // Update abstract status to under_review if it's still submitted
    await pool.query(
      `UPDATE abstracts 
       SET status = CASE 
         WHEN status = 'submitted' THEN 'under_review'
         ELSE status
       END,
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [abstract_id]
    );

    res.status(201).json({
      message: 'Review submitted successfully',
      review: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// READ - Get all reviews (admin only)
router.get('/', async (req, res) => {
  try {
    const { abstract_id, reviewer_email, recommendation } = req.query;
    
    let query = `
      SELECT r.*, a.title as abstract_title, a.authors as abstract_authors
      FROM reviews r
      JOIN abstracts a ON r.abstract_id = a.id
    `;
    let params = [];
    const conditions = [];

    if (abstract_id) {
      conditions.push(`r.abstract_id = $${params.length + 1}`);
      params.push(abstract_id);
    }

    if (reviewer_email) {
      conditions.push(`r.reviewer_email = $${params.length + 1}`);
      params.push(reviewer_email);
    }

    if (recommendation) {
      conditions.push(`r.recommendation = $${params.length + 1}`);
      params.push(recommendation);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY r.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// READ - Get review by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT r.*, a.title as abstract_title, a.authors as abstract_authors
      FROM reviews r
      JOIN abstracts a ON r.abstract_id = a.id
      WHERE r.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// UPDATE review
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      score,
      comments,
      recommendation,
      detailed_feedback
    } = req.body;

    // Validate score range if provided
    if (score && (score < 1 || score > 10)) {
      return res.status(400).json({ error: 'Score must be between 1 and 10' });
    }

    const result = await pool.query(
      `UPDATE reviews SET 
        score = COALESCE($1, score),
        comments = COALESCE($2, comments),
        recommendation = COALESCE($3, recommendation),
        detailed_feedback = COALESCE($4, detailed_feedback),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5 RETURNING *`,
      [score, comments, recommendation, JSON.stringify(detailed_feedback), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json({
      message: 'Review updated successfully',
      review: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE review
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM reviews WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    res.json({ 
      message: 'Review deleted successfully', 
      deleted: result.rows[0] 
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get reviews for a specific abstract
router.get('/abstract/:abstractId', async (req, res) => {
  try {
    const { abstractId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM reviews WHERE abstract_id = $1 ORDER BY created_at DESC',
      [abstractId]
    );

    // Calculate average score
    const avgScore = result.rows.length > 0 
      ? result.rows.reduce((sum, review) => sum + review.score, 0) / result.rows.length
      : null;

    // Count recommendations
    const recommendations = result.rows.reduce((acc, review) => {
      acc[review.recommendation] = (acc[review.recommendation] || 0) + 1;
      return acc;
    }, {});

    res.json({
      reviews: result.rows,
      summary: {
        total_reviews: result.rows.length,
        average_score: avgScore ? Math.round(avgScore * 100) / 100 : null,
        recommendations
      }
    });
  } catch (error) {
    console.error('Error fetching reviews for abstract:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get reviews by reviewer
router.get('/reviewer/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    const result = await pool.query(`
      SELECT r.*, a.title as abstract_title, a.track, a.submission_type
      FROM reviews r
      JOIN abstracts a ON r.abstract_id = a.id
      WHERE r.reviewer_email = $1
      ORDER BY r.created_at DESC
    `, [email]);

    res.json({
      reviewer_email: email,
      total_reviews: result.rows.length,
      reviews: result.rows
    });
  } catch (error) {
    console.error('Error fetching reviews by reviewer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get review statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_reviews,
        COUNT(DISTINCT reviewer_email) as unique_reviewers,
        COUNT(DISTINCT abstract_id) as reviewed_abstracts,
        AVG(score) as average_score,
        COUNT(*) FILTER (WHERE recommendation = 'accept') as accept_count,
        COUNT(*) FILTER (WHERE recommendation = 'reject') as reject_count,
        COUNT(*) FILTER (WHERE recommendation = 'minor_revision') as minor_revision_count,
        COUNT(*) FILTER (WHERE recommendation = 'major_revision') as major_revision_count
      FROM reviews
    `);

    const reviewerStats = await pool.query(`
      SELECT 
        reviewer_email,
        reviewer_name,
        COUNT(*) as review_count,
        AVG(score) as avg_score_given
      FROM reviews
      GROUP BY reviewer_email, reviewer_name
      ORDER BY review_count DESC
      LIMIT 10
    `);

    res.json({
      overview: stats.rows[0],
      top_reviewers: reviewerStats.rows
    });
  } catch (error) {
    console.error('Error fetching review statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
