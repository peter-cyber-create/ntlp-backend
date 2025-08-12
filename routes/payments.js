import express from 'express';
import { pool as db } from '../config/db.js';
const router = express.Router();

// POST /api/payments/verify (existing verification)
router.post('/verify', async (req, res) => {
  const { reference, transactionId } = req.body;
  if (!reference) {
    return res.status(400).json({ error: 'Missing payment reference' });
  }
  try {
    const result = await db.query(
      'SELECT payment_status FROM registrations WHERE payment_reference = $1',
      [reference]
    );
    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    const status = result.rows[0].payment_status;
    return res.json({ status });
  } catch (err) {
    console.error('Payment verification error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/payments/yopay
import fetch from 'node-fetch';
router.post('/yopay', async (req, res) => {
  const { phone, amount, reason } = req.body;
  if (!phone || !amount) {
    return res.status(400).json({ error: 'Missing phone or amount' });
  }
  try {
    const response = await fetch('http://localhost:5001/deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, amount, reason })
    });
    const result = await response.json();
    res.json(result);
  } catch (err) {
    console.error('YoPayments error:', err);
    res.status(500).json({ error: 'YoPayments service error', details: err.message });
  }
});

export default router;
