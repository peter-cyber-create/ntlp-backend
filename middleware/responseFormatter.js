// backend/middleware/responseFormatter.js
// Enhanced notification and response formatting middleware

/**
 * Centralized response formatter for consistent API responses and notifications
 * Provides structured response format for success, error, and notification messages
 */

// Success response formatter
export const successResponse = (res, data, message = 'Operation successful', statusCode = 200) => {
  const response = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
    notification: {
      type: 'success',
      title: 'Success',
      message,
      duration: 3000,
      icon: '✅'
    }
  };
  
  return res.status(statusCode).json(response);
};

// Error response formatter
export const errorResponse = (res, error, statusCode = 500, details = null) => {
  const response = {
    success: false,
    error: typeof error === 'string' ? error : error.message,
    details,
    timestamp: new Date().toISOString(),
    notification: {
      type: 'error',
      title: 'Error',
      message: typeof error === 'string' ? error : error.message,
      duration: 5000,
      icon: '❌',
      actions: statusCode === 400 ? [
        { label: 'Try Again', action: 'retry' }
      ] : []
    }
  };
  
  // Log error details for debugging
  if (statusCode >= 500) {
    console.error('Server Error:', {
      error: error,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
  
  return res.status(statusCode).json(response);
};

// Validation error response formatter
export const validationErrorResponse = (res, validationErrors) => {
  const response = {
    success: false,
    error: 'Validation failed',
    details: validationErrors,
    timestamp: new Date().toISOString(),
    notification: {
      type: 'warning',
      title: 'Validation Error',
      message: 'Please check the form and try again',
      duration: 4000,
      icon: '⚠️',
      details: validationErrors.map(err => ({
        field: err.path,
        message: err.msg
      })),
      actions: [
        { label: 'Review Form', action: 'focus_first_error' }
      ]
    }
  };
  
  return res.status(400).json(response);
};

// Bulk operation response formatter
export const bulkOperationResponse = (res, operation, affected, total, statusCode = 200) => {
  const isPartialSuccess = affected.length < total;
  const response = {
    success: !isPartialSuccess,
    message: `${operation} completed`,
    data: {
      operation,
      affected: affected.length,
      total,
      items: affected
    },
    timestamp: new Date().toISOString(),
    notification: {
      type: isPartialSuccess ? 'warning' : 'success',
      title: isPartialSuccess ? 'Partial Success' : 'Success',
      message: `${affected.length} of ${total} items ${operation} successfully`,
      duration: 4000,
      icon: isPartialSuccess ? '⚠️' : '✅',
      progress: {
        current: affected.length,
        total: total,
        percentage: Math.round((affected.length / total) * 100)
      },
      actions: isPartialSuccess ? [
        { label: 'View Details', action: 'show_details' },
        { label: 'Retry Failed', action: 'retry_failed' }
      ] : []
    }
  };
  
  return res.status(statusCode).json(response);
};

// Information/status response formatter
export const infoResponse = (res, message, data = null, type = 'info') => {
  const iconMap = {
    info: 'ℹ️',
    warning: '⚠️',
    loading: '⏳',
    pending: '⏸️'
  };
  
  const response = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
    notification: {
      type,
      title: type.charAt(0).toUpperCase() + type.slice(1),
      message,
      duration: 3000,
      icon: iconMap[type] || 'ℹ️'
    }
  };
  
  return res.status(200).json(response);
};

// Authentication error response
export const authErrorResponse = (res, message = 'Authentication required') => {
  const response = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    notification: {
      type: 'error',
      title: 'Authentication Required',
      message,
      duration: 5000,
      icon: '🔒',
      actions: [
        { label: 'Login', action: 'redirect_login' }
      ]
    }
  };
  
  return res.status(401).json(response);
};

// Rate limiting response
export const rateLimitResponse = (res, retryAfter = 60) => {
  const response = {
    success: false,
    error: 'Too many requests',
    retryAfter,
    timestamp: new Date().toISOString(),
    notification: {
      type: 'warning',
      title: 'Rate Limited',
      message: `Too many requests. Please try again in ${retryAfter} seconds.`,
      duration: 6000,
      icon: '⏰',
      countdown: retryAfter,
      actions: [
        { label: 'Wait and Retry', action: 'auto_retry', delay: retryAfter * 1000 }
      ]
    }
  };
  
  return res.status(429).json(response);
};

// File upload response formatter
export const fileUploadResponse = (res, file, message = 'File uploaded successfully') => {
  const response = {
    success: true,
    message,
    data: {
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      path: file.path
    },
    timestamp: new Date().toISOString(),
    notification: {
      type: 'success',
      title: 'Upload Complete',
      message: `${file.originalname} uploaded successfully`,
      duration: 3000,
      icon: '📁',
      progress: {
        current: 100,
        total: 100,
        percentage: 100
      }
    }
  };
  
  return res.status(201).json(response);
};

// Email notification response
export const emailNotificationResponse = (res, recipient, subject, success = true) => {
  const response = {
    success,
    message: success ? 'Email sent successfully' : 'Email sending failed',
    data: {
      recipient,
      subject,
      sentAt: new Date().toISOString()
    },
    timestamp: new Date().toISOString(),
    notification: {
      type: success ? 'success' : 'error',
      title: success ? 'Email Sent' : 'Email Failed',
      message: success 
        ? `Email sent to ${recipient}` 
        : `Failed to send email to ${recipient}`,
      duration: success ? 3000 : 5000,
      icon: success ? '✉️' : '❌',
      actions: success ? [] : [
        { label: 'Retry', action: 'retry_email' }
      ]
    }
  };
  
  return res.status(success ? 200 : 500).json(response);
};

// Real-time notification for dashboard updates
export const dashboardUpdateNotification = (data, type = 'stats_update') => {
  return {
    type: 'realtime',
    event: type,
    data,
    timestamp: new Date().toISOString(),
    notification: {
      type: 'info',
      title: 'Dashboard Updated',
      message: 'Statistics have been refreshed',
      duration: 2000,
      icon: '📊',
      silent: true // Don't show popup, just update UI
    }
  };
};

// Export all formatters
export default {
  successResponse,
  errorResponse,
  validationErrorResponse,
  bulkOperationResponse,
  infoResponse,
  authErrorResponse,
  rateLimitResponse,
  fileUploadResponse,
  emailNotificationResponse,
  dashboardUpdateNotification
};
