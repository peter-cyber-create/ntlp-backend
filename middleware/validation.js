// backend/middleware/validation.js
import { body, validationResult } from 'express-validator';
import { validationErrorResponse } from './responseFormatter.js';

// Generic validation error handler
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return validationErrorResponse(res, errors.array());
  }
  next();
};

// Registration validation
export const validateRegistration = [
  body('first_name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name is required and must be less than 100 characters'),
  body('last_name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name is required and must be less than 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  // Support both institution and organization fields
  body('institution')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Institution must be less than 255 characters'),
  body('organization')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Organization must be less than 255 characters'),
  // Support both country and district fields
  body('country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Country must be less than 100 characters'),
  body('district')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('District must be less than 100 characters'),
  body('position')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Position must be less than 255 characters'),
  body('registration_type')
    .isIn(['student', 'academic', 'industry', 'professional', 'early_bird', 'regular'])
    .withMessage('Invalid registration type'),
  body('status')
    .optional()
    .isIn(['pending', 'confirmed', 'cancelled', 'waitlist'])
    .withMessage('Invalid status'),
  handleValidationErrors
];

// Speaker validation
export const validateSpeaker = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name is required and must be less than 255 characters'),
  body('title')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title is required and must be less than 255 characters'),
  body('biography')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Biography is required and must be at least 10 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('keynote_speaker')
    .optional()
    .isBoolean()
    .withMessage('Keynote speaker must be a boolean value'),
  handleValidationErrors
];

// Session validation
export const validateSession = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title is required and must be less than 255 characters'),
  body('start_time')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  body('end_time')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format'),
  body('date')
    .isISO8601()
    .toDate()
    .withMessage('Date must be a valid date'),
  body('session_type')
    .optional()
    .isIn(['keynote', 'presentation', 'panel', 'workshop', 'poster', 'break'])
    .withMessage('Invalid session type'),
  body('capacity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Capacity must be a positive integer'),
  handleValidationErrors
];

// Activity validation
export const validateActivity = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title is required and must be less than 255 characters'),
  body('description')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Description is required and must be at least 10 characters'),
  body('date')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Date must be a valid date'),
  body('time')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Time must be in HH:MM format'),
  body('category')
    .optional()
    .isIn(['workshop', 'networking', 'social', 'cultural', 'other'])
    .withMessage('Invalid category'),
  body('capacity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Capacity must be a positive integer'),
  handleValidationErrors
];

// Announcement validation
export const validateAnnouncement = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title is required and must be less than 255 characters'),
  body('content')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Content is required and must be at least 10 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'normal', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  body('type')
    .optional()
    .isIn(['general', 'registration', 'program', 'travel', 'accommodation'])
    .withMessage('Invalid announcement type'),
  body('start_date')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Start date must be a valid date'),
  body('end_date')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('End date must be a valid date'),
  handleValidationErrors
];

// Abstract validation
export const validateAbstract = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Title is required and must be between 5 and 500 characters'),
  body('abstract')
    .trim()
    .isLength({ min: 100, max: 5000 })
    .withMessage('Abstract is required and must be between 100 and 5000 characters'),
  body('authors')
    .isArray({ min: 1 })
    .withMessage('At least one author is required')
    .custom((authors) => {
      // Validate each author object
      for (let author of authors) {
        if (!author.name || !author.email || !author.affiliation) {
          throw new Error('Each author must have name, email, and affiliation');
        }
        if (!/\S+@\S+\.\S+/.test(author.email)) {
          throw new Error('Author emails must be valid');
        }
      }
      return true;
    }),
  body('corresponding_author_email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid corresponding author email is required'),
  body('submission_type')
    .optional()
    .isIn(['abstract', 'full_paper', 'poster', 'demo'])
    .withMessage('Invalid submission type'),
  body('track')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Track name must be less than 100 characters'),
  body('keywords')
    .optional()
    .isArray()
    .withMessage('Keywords must be an array'),
  handleValidationErrors
];

// Review validation
export const validateReview = [
  body('abstract_id')
    .isInt({ min: 1 })
    .withMessage('Valid abstract ID is required'),
  body('reviewer_name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Reviewer name is required and must be less than 255 characters'),
  body('reviewer_email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid reviewer email is required'),
  body('score')
    .isInt({ min: 1, max: 10 })
    .withMessage('Score must be an integer between 1 and 10'),
  body('recommendation')
    .isIn(['accept', 'reject', 'minor_revision', 'major_revision'])
    .withMessage('Invalid recommendation'),
  body('comments')
    .optional()
    .isLength({ max: 5000 })
    .withMessage('Comments must be less than 5000 characters'),
  body('detailed_feedback')
    .optional()
    .isObject()
    .withMessage('Detailed feedback must be an object'),
  handleValidationErrors
];

// Abstract status update validation
export const validateAbstractStatus = [
  body('status')
    .isIn(['submitted', 'under-review', 'accepted', 'rejected', 'pending'])
    .withMessage('Invalid status'),
  body('reviewer_comments')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Reviewer comments must be less than 2000 characters'),
  handleValidationErrors
];

// Contact validation
export const validateContact = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name is required and must be less than 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('organization')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Organization must be less than 200 characters'),
  body('subject')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Subject is required and must be less than 200 characters'),
  body('message')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message is required and must be less than 2000 characters'),
  handleValidationErrors
];
