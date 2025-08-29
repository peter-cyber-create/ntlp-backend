import express from 'express';
import multer from 'multer';
import path from 'path';
import mysql from 'mysql2/promise';

import { pool } from '../config/db.js';
import fs from 'fs';

const router = express.Router();

// GET /api/uploads - List available upload endpoints
router.get('/', (req, res) => {
  res.json({
    message: 'File Uploads API',
    endpoints: {
      'POST /payment-proof': 'Upload payment proof file',
      'GET /payment-proof/:fileId': 'Get file info',
      'PATCH /payment-proof/:fileId/status': 'Update file status (admin)',
      'DELETE /payment-proof/:fileId': 'Delete file (admin)'
    }
  });
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/payment-proofs';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `payment-proof-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only image and PDF files
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and PDF files are allowed.'), false);
    }
  }
});

// POST /api/uploads/payment-proof - Upload payment proof
router.post('/payment-proof', upload.single('paymentProof'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { entityType, entityId, uploadedBy } = req.body;
    
    if (!entityType || !entityId || !uploadedBy) {
      return res.status(400).json({ error: 'Missing required fields: entityType, entityId, uploadedBy' });
    }

    // Insert file upload record
    const [result] = await pool.query(`
      INSERT INTO file_uploads (
        file_name, original_name, file_path, file_size, mime_type, 
        entity_type, entity_id, uploaded_by, upload_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())
    `, [
      req.file.filename,
      req.file.originalname,
      req.file.path,
      req.file.size,
      req.file.mimetype,
      entityType,
      entityId,
      uploadedBy
    ]);

    // Return file info
    res.status(201).json({
      message: 'Payment proof uploaded successfully',
      file: {
        id: result.insertId,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadStatus: 'pending'
      }
    });
  } catch (error) {
    console.error('Error uploading payment proof:', error);
    res.status(500).json({ error: 'Failed to upload payment proof' });
  }
});

// GET /api/uploads/payment-proof/:fileId - Get file info
router.get('/payment-proof/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const [rows] = await pool.query('SELECT * FROM file_uploads WHERE id = ?', [fileId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching file info:', error);
    res.status(500).json({ error: 'Failed to fetch file info' });
  }
});

// PATCH /api/uploads/payment-proof/:fileId/status - Update file status (admin only)
router.patch('/payment-proof/:fileId/status', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { status, adminNotes } = req.body;
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const [result] = await pool.query(`
      UPDATE file_uploads SET 
        upload_status = ?, 
        admin_notes = ?,
        updated_at = NOW()
      WHERE id = ?
    `, [status, adminNotes, fileId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.json({
      message: 'File status updated successfully',
      fileId: fileId,
      status: status
    });
  } catch (error) {
    console.error('Error updating file status:', error);
    res.status(500).json({ error: 'Failed to update file status' });
  }
});

// DELETE /api/uploads/payment-proof/:fileId - Delete file (admin only)
router.delete('/payment-proof/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // Get file info first
    const [rows] = await pool.query('SELECT * FROM file_uploads WHERE id = ?', [fileId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const file = rows[0];
    
    // Delete file from filesystem
    if (fs.existsSync(file.file_path)) {
      fs.unlinkSync(file.file_path);
    }
    
    // Delete from database
    await pool.query('DELETE FROM file_uploads WHERE id = ?', [fileId]);
    
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

export default router;
