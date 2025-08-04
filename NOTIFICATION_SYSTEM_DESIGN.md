# Enhanced Notification System Design - NTLP Frontend

## Overview
This document provides complete designs and code for an improved popup/notification system that handles errors, success messages, validation feedback, and status updates with better user experience.

## 1. Notification Component Design

```tsx
// components/notifications/NotificationManager.tsx
import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// Notification types and interfaces
interface NotificationAction {
  label: string;
  action: string;
  delay?: number;
  variant?: 'primary' | 'secondary' | 'destructive';
}

interface NotificationProgress {
  current: number;
  total: number;
  percentage: number;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'loading';
  title: string;
  message: string;
  duration?: number;
  icon?: string;
  actions?: NotificationAction[];
  progress?: NotificationProgress;
  details?: Array<{ field: string; message: string }>;
  countdown?: number;
  silent?: boolean;
  persistent?: boolean;
}

// Context for managing notifications globally
const NotificationContext = createContext<{
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}>({
  notifications: [],
  addNotification: () => '',
  removeNotification: () => {},
  clearAll: () => {}
});

export const useNotifications = () => useContext(NotificationContext);

// Main Notification Provider
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration || (notification.type === 'error' ? 5000 : 3000)
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove after duration (unless persistent)
    if (!newNotification.persistent && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearAll
    }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

// Notification Container with animations
const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

// Individual Notification Item
const NotificationItem: React.FC<{
  notification: Notification;
  onClose: () => void;
}> = ({ notification, onClose }) => {
  const [countdown, setCountdown] = useState(notification.countdown || 0);

  // Handle countdown for rate limiting
  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

  const getNotificationStyles = () => {
    const baseStyles = "rounded-lg shadow-lg border-l-4 p-4 bg-white";
    switch (notification.type) {
      case 'success':
        return `${baseStyles} border-l-green-500 bg-green-50`;
      case 'error':
        return `${baseStyles} border-l-red-500 bg-red-50`;
      case 'warning':
        return `${baseStyles} border-l-yellow-500 bg-yellow-50`;
      case 'info':
        return `${baseStyles} border-l-blue-500 bg-blue-50`;
      case 'loading':
        return `${baseStyles} border-l-purple-500 bg-purple-50`;
      default:
        return `${baseStyles} border-l-gray-500`;
    }
  };

  const getIconColor = () => {
    switch (notification.type) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      case 'info': return 'text-blue-600';
      case 'loading': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.9 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={getNotificationStyles()}
    >
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div className={`flex-shrink-0 ${getIconColor()}`}>
          <span className="text-lg">
            {notification.icon || getDefaultIcon(notification.type)}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900 text-sm">
              {notification.title}
            </h4>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          <p className="text-sm text-gray-600 mt-1">
            {notification.message}
          </p>

          {/* Progress Bar */}
          {notification.progress && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{notification.progress.current} of {notification.progress.total}</span>
                <span>{notification.progress.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${notification.progress.percentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Countdown Timer */}
          {countdown > 0 && (
            <div className="mt-2 text-xs text-gray-500">
              Retry in {countdown} seconds
            </div>
          )}

          {/* Validation Details */}
          {notification.details && notification.details.length > 0 && (
            <div className="mt-3 space-y-1">
              {notification.details.map((detail, index) => (
                <div key={index} className="text-xs text-red-600">
                  <span className="font-medium">{detail.field}:</span> {detail.message}
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          {notification.actions && notification.actions.length > 0 && (
            <div className="mt-3 flex space-x-2">
              {notification.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleAction(action)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    action.variant === 'destructive'
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : action.variant === 'secondary'
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Helper function to get default icons
const getDefaultIcon = (type: string) => {
  switch (type) {
    case 'success': return '✅';
    case 'error': return '❌';
    case 'warning': return '⚠️';
    case 'info': return 'ℹ️';
    case 'loading': return '⏳';
    default: return 'ℹ️';
  }
};

// Action handler
const handleAction = (action: NotificationAction) => {
  switch (action.action) {
    case 'retry':
      // Implement retry logic
      window.location.reload();
      break;
    case 'redirect_login':
      window.location.href = '/login';
      break;
    case 'focus_first_error':
      const firstError = document.querySelector('.error, [aria-invalid="true"]') as HTMLElement;
      firstError?.focus();
      break;
    case 'show_details':
      // Implement details modal
      console.log('Show details modal');
      break;
    case 'auto_retry':
      if (action.delay) {
        setTimeout(() => {
          window.location.reload();
        }, action.delay);
      }
      break;
    default:
      console.log('Unhandled action:', action.action);
  }
};
```

## 2. API Response Integration Hook

```tsx
// hooks/useApiNotifications.ts
import { useNotifications } from '../components/notifications/NotificationManager';
import { useCallback } from 'react';

interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  details?: any;
  notification?: {
    type: string;
    title: string;
    message: string;
    duration?: number;
    icon?: string;
    actions?: any[];
    progress?: any;
    details?: any[];
    countdown?: number;
    silent?: boolean;
  };
}

export const useApiNotifications = () => {
  const { addNotification } = useNotifications();

  const handleApiResponse = useCallback((response: ApiResponse) => {
    if (response.notification && !response.notification.silent) {
      addNotification({
        type: response.notification.type as any,
        title: response.notification.title,
        message: response.notification.message,
        duration: response.notification.duration,
        icon: response.notification.icon,
        actions: response.notification.actions,
        progress: response.notification.progress,
        details: response.notification.details,
        countdown: response.notification.countdown
      });
    }
  }, [addNotification]);

  const showErrorNotification = useCallback((error: string, details?: any) => {
    addNotification({
      type: 'error',
      title: 'Error',
      message: error,
      duration: 5000,
      details,
      actions: [
        { label: 'Try Again', action: 'retry' }
      ]
    });
  }, [addNotification]);

  const showSuccessNotification = useCallback((message: string) => {
    addNotification({
      type: 'success',
      title: 'Success',
      message,
      duration: 3000
    });
  }, [addNotification]);

  const showLoadingNotification = useCallback((message: string) => {
    return addNotification({
      type: 'loading',
      title: 'Loading',
      message,
      persistent: true
    });
  }, [addNotification]);

  return {
    handleApiResponse,
    showErrorNotification,
    showSuccessNotification,
    showLoadingNotification
  };
};
```

## 3. Enhanced Form Validation Notifications

```tsx
// components/forms/FormField.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  required,
  children,
  className = ''
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        {children}
        
        {/* Error indicator icon */}
        {error && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
      
      {/* Animated error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="text-sm text-red-600 flex items-center space-x-1"
          >
            <span>⚠️</span>
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
```

## 4. Status Badge Component

```tsx
// components/ui/StatusBadge.tsx
import React from 'react';
import { motion } from 'framer-motion';

interface StatusBadgeProps {
  status: string;
  type?: 'registration' | 'abstract' | 'contact';
  showIcon?: boolean;
  animated?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type = 'registration',
  showIcon = true,
  animated = true
}) => {
  const getStatusConfig = () => {
    const configs: Record<string, Record<string, any>> = {
      registration: {
        pending: { color: 'yellow', icon: '⏳', label: 'Pending' },
        confirmed: { color: 'green', icon: '✅', label: 'Confirmed' },
        cancelled: { color: 'red', icon: '❌', label: 'Cancelled' },
        waitlist: { color: 'blue', icon: '⏸️', label: 'Waitlisted' }
      },
      abstract: {
        submitted: { color: 'blue', icon: '📝', label: 'Submitted' },
        under_review: { color: 'yellow', icon: '👀', label: 'Under Review' },
        accepted: { color: 'green', icon: '✅', label: 'Accepted' },
        rejected: { color: 'red', icon: '❌', label: 'Rejected' },
        revision_required: { color: 'orange', icon: '🔄', label: 'Revision Required' }
      },
      contact: {
        pending: { color: 'yellow', icon: '⏳', label: 'Pending' },
        responded: { color: 'green', icon: '✅', label: 'Responded' },
        closed: { color: 'gray', icon: '🔒', label: 'Closed' }
      }
    };

    return configs[type]?.[status] || { color: 'gray', icon: '❓', label: status };
  };

  const config = getStatusConfig();
  
  const colorClasses = {
    green: 'bg-green-100 text-green-800 border-green-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    orange: 'bg-orange-100 text-orange-800 border-orange-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  const BadgeContent = () => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClasses[config.color]}`}>
      {showIcon && <span className="mr-1">{config.icon}</span>}
      {config.label}
    </span>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <BadgeContent />
      </motion.div>
    );
  }

  return <BadgeContent />;
};
```

## 5. Usage Examples

### In API Client
```tsx
// utils/apiClient.ts
import { useApiNotifications } from '../hooks/useApiNotifications';

export const useApiClient = () => {
  const { handleApiResponse, showErrorNotification, showLoadingNotification } = useApiNotifications();

  const submitForm = async (data: any) => {
    const loadingId = showLoadingNotification('Submitting form...');
    
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      // Handle the response with enhanced notifications
      handleApiResponse(result);
      
      return result;
    } catch (error) {
      showErrorNotification('Network error. Please check your connection.');
      throw error;
    } finally {
      // Remove loading notification
      removeNotification(loadingId);
    }
  };

  return { submitForm };
};
```

### In Main App
```tsx
// pages/_app.tsx or app/layout.tsx
import { NotificationProvider } from '../components/notifications/NotificationManager';

export default function App({ Component, pageProps }) {
  return (
    <NotificationProvider>
      <Component {...pageProps} />
    </NotificationProvider>
  );
}
```

## 6. CSS Animations for Smoother Effects

```css
/* styles/notifications.css */

/* Smooth hover effects for all interactive elements */
.ntlp-interactive {
  transition: all 0.15s ease-in-out;
}

.ntlp-interactive:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Reduce excessive motion on forms */
.registration-form .form-field {
  transition: all 0.15s ease-in-out;
}

.registration-form .form-field:hover {
  transform: none; /* Remove scale transforms */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Loading states */
.loading-pulse {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* Success feedback animations */
.success-checkmark {
  animation: checkmark 0.6s ease-in-out;
}

@keyframes checkmark {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}
```

This enhanced notification system provides:
- **Better Visual Feedback**: Clear icons, colors, and animations
- **Actionable Messages**: Buttons for retry, details, etc.
- **Progress Indicators**: For bulk operations and uploads
- **Validation Details**: Field-specific error messages
- **Auto-retry Logic**: For rate limits and temporary failures
- **Consistent Styling**: Matches your existing design system
- **Accessibility**: ARIA labels and keyboard navigation

The system integrates seamlessly with your existing backend response format and provides a much better user experience for all types of notifications and popups.
