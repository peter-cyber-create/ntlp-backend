// backend/middleware/auth.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { authErrorResponse, rateLimitResponse } from './responseFormatter.js';

// Security middleware
export const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});

// Production-ready rate limiting
export const productionRateLimit = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: process.env.RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS === 'true',
  keyGenerator: (req) => {
    // Use API key if available, otherwise use IP
    return req.headers['x-api-key'] || req.ip || req.connection.remoteAddress;
  },
  handler: (req, res) => {
    return rateLimitResponse(res, Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000));
  }
});

// API key middleware for external integrations
export const requireApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return authErrorResponse(res, 'API key is required', 401);
  }
  
  if (apiKey !== process.env.API_KEY) {
    return authErrorResponse(res, 'Invalid API key', 401);
  }
  
  // Log API key usage for monitoring
  req.apiKeyUsed = true;
  next();
};

// JWT token verification middleware with enhanced security
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return authErrorResponse(res, 'Access token is required', 401);
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if token is expired
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      return authErrorResponse(res, 'Token has expired', 401);
    }
    
    // Check if token was issued before a certain time (for token revocation)
    if (decoded.iat && decoded.iat < (Date.now() / 1000) - (7 * 24 * 60 * 60)) { // 7 days
      return authErrorResponse(res, 'Token is too old', 401);
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return authErrorResponse(res, 'Invalid token', 401);
    } else if (error.name === 'TokenExpiredError') {
      return authErrorResponse(res, 'Token has expired', 401);
    } else {
      return authErrorResponse(res, 'Token verification failed', 401);
    }
  }
};

// Admin role check middleware
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return authErrorResponse(res, 'Admin access required', 403);
  }
  
  // Log admin action for audit trail
  req.adminAction = true;
  next();
};

// Enhanced admin authentication with bcrypt
export const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return authErrorResponse(res, 'No token provided', 401);
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role !== 'admin') {
      return authErrorResponse(res, 'Admin access required', 403);
    }
    
    // Verify admin still exists and is active
    const { pool } = await import('../config/db.js');
    const [adminResult] = await pool.query(
      'SELECT id, email, role, status FROM admins WHERE id = ? AND status = ?',
      [decoded.id, 'active']
    );
    
    if (adminResult.length === 0) {
      return authErrorResponse(res, 'Admin account not found or inactive', 401);
    }
    
    req.admin = adminResult[0];
    req.adminAction = true;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return authErrorResponse(res, 'Invalid token', 401);
    } else if (error.name === 'TokenExpiredError') {
      return authErrorResponse(res, 'Token has expired', 401);
    } else {
      return authErrorResponse(res, 'Authentication failed', 401);
    }
  }
};

// Password validation middleware
export const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (password.length < minLength) {
    return { valid: false, message: `Password must be at least ${minLength} characters long` };
  }
  
  if (!hasUpperCase) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!hasLowerCase) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!hasNumbers) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  
  if (!hasSpecialChar) {
    return { valid: false, message: 'Password must contain at least one special character' };
  }
  
  return { valid: true, message: 'Password meets requirements' };
};

// Hash password utility
export const hashPassword = async (password) => {
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  return await bcrypt.hash(password, saltRounds);
};

// Compare password utility
export const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// CSRF protection middleware
export const csrfProtection = (req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }
  
  const csrfToken = req.headers['x-csrf-token'];
  const sessionToken = req.session?.csrfToken;
  
  if (!csrfToken || !sessionToken || csrfToken !== sessionToken) {
    return authErrorResponse(res, 'CSRF token validation failed', 403);
  }
  
  next();
};

// Input sanitization middleware
export const sanitizeInput = (req, res, next) => {
  // Sanitize body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim().replace(/[<>]/g, '');
      }
    });
  }
  
  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key].trim().replace(/[<>]/g, '');
      }
    });
  }
  
  next();
};

// Request logging middleware
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    };
    
    if (req.user) {
      logData.userId = req.user.id;
      logData.userRole = req.user.role;
    }
    
    console.log('Request:', JSON.stringify(logData));
  });
    
    next();
  };

// Logging functions for admin actions
export const logAdminAction = (adminId, action, entityType, entityId, req, additionalData = {}) => {
  const logData = {
    adminId,
    action,
    entityType,
    entityId,
    timestamp: new Date().toISOString(),
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    },
    ...additionalData
  };
  
  console.log('Admin Action:', JSON.stringify(logData));
};

export const logSecurityEvent = (event, req, additionalData = {}) => {
  const logData = {
    event,
    timestamp: new Date().toISOString(),
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id || null,
      userRole: req.user?.role || null
    },
    ...additionalData
  };
  
  console.log('Security Event:', JSON.stringify(logData));
};
