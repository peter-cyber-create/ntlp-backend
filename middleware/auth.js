// backend/middleware/auth.js
import jwt from 'jsonwebtoken';
import { authErrorResponse, rateLimitResponse } from './responseFormatter.js';

// Simple API key middleware for basic authentication
export const requireApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return authErrorResponse(res, 'API key is required');
  }
  
  if (apiKey !== process.env.API_KEY) {
    return authErrorResponse(res, 'Invalid API key');
  }
  
  next();
};

// JWT token verification middleware
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return authErrorResponse(res, 'Access token is required');
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return authErrorResponse(res, 'Invalid or expired token');
  }
};

// Admin role check middleware
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return authErrorResponse(res, 'Admin access required');
  }
  next();
};

// Rate limiting middleware (simple implementation)
const requestCounts = new Map();

export const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    const clientId = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!requestCounts.has(clientId)) {
      requestCounts.set(clientId, []);
    }
    
    const requests = requestCounts.get(clientId);
    
    // Remove old requests outside the window
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    
    if (validRequests.length >= maxRequests) {
      return rateLimitResponse(res, Math.ceil(windowMs / 1000));
    }
    
    validRequests.push(now);
    requestCounts.set(clientId, validRequests);
    
    next();
  };
};
