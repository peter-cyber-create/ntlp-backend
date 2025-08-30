// backend/index.js
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import userRoutes from './routes/users.js';
import activityRoutes from './routes/activities.js';
import speakerRoutes from './routes/speakers.js';
import sessionRoutes from './routes/sessions.js';
import announcementRoutes from './routes/announcements.js';
import registrationRoutes from './routes/registrations.js';
import abstractRoutes from './routes/abstracts.js';
import reviewRoutes from './routes/reviews.js';
import contactRoutes from './routes/contacts.js';
import sponsorshipRoutes from './routes/sponsorships.js';
import uploadRoutes from './routes/uploads.js';
import adminRoutes from './routes/admin.js';
import { rateLimit } from './middleware/auth.js';
import { verifyEmailConfig } from './middleware/emailService.js';
const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Rate limiting
app.use(rateLimit(1000, 15 * 60 * 1000)); // 1000 requests per 15 minutes

// Initialize email service
verifyEmailConfig();

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'NTLP Backend API',
    version: '1.0.0'
  });
});

// API Documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'NTLP Conference Management API',
    version: '1.0.0',
    endpoints: {
      registrations: '/api/registrations',
      activities: '/api/activities',
      speakers: '/api/speakers', 
      sessions: '/api/sessions',
      announcements: '/api/announcements',
      abstracts: '/api/abstracts',
      reviews: '/api/reviews',
      contacts: '/api/contacts',
      sponsorships: '/api/sponsorships',
      uploads: '/api/uploads',
      admin: '/api/admin',
      'session-registrations': '/api/register/sessions',
      'activity-registrations': '/api/register/activities'
    },
    health: '/health',
    features: [
      'Conference registration management',
      'Abstract submission and review system', 
      'Speaker and session management',
      'Activity and event coordination',
      'Announcement system',
      'Full peer review workflow'
    ]
  });
});

// API Routes
// Payment routes are disabled. Manual payment instructions are provided instead.
// import paymentsRoutes from './routes/payments.js';
// ...existing code...
// Removed invalid import of './app/api/registrations.js' (non-JS content)
app.use('/api/users', userRoutes);          // Alternative alias for backward compatibility
app.use('/api/activities', activityRoutes);
app.use('/api/speakers', speakerRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/register', registrationRoutes);  // Session/activity registrations
app.use('/api/abstracts', abstractRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/sponsorships', sponsorshipRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/admin', adminRoutes);
// app.use('/api/payments', paymentsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    success: false,
    error: 'Something went wrong!',
    timestamp: new Date().toISOString(),
    notification: {
      type: 'error',
      title: 'Server Error',
      message: 'An unexpected error occurred. Please try again.',
      duration: 5000,
      icon: '❌',
      actions: [
        { label: 'Refresh Page', action: 'reload' },
        { label: 'Contact Support', action: 'contact_support' }
      ]
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    available_endpoints: [
      '/health',
      '/api',
      '/api/registrations',
      '/api/activities', 
      '/api/speakers',
      '/api/sessions',
      '/api/announcements',
      '/api/abstracts',
      '/api/reviews',
      '/api/contacts',
      '/api/sponsorships',
      '/api/uploads',
      '/api/admin',
      '/api/register'
    ]
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 NTLP Backend API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API docs: http://localhost:${PORT}/api`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📝 Features: Registration, Abstracts, Reviews, Sessions, Activities`);
});
