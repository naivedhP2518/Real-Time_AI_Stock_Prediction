/**
 * @file validators.js
 * @description Centralized express-validator input sanitization rules.
 *              Provides XSS protection and type-safe field validation
 *              for all critical API endpoints.
 */

const { body, param, query, validationResult } = require('express-validator');

// ─── Validation Result Handler ────────────────────────────────────────────────
/**
 * Middleware to evaluate validation chain results.
 * Returns 422 with structured error list if validation fails.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: 'fail',
      message: 'Validation failed',
      errors: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }
  next();
};

// ─── Auth Validators ──────────────────────────────────────────────────────────
const validateRegister = [
  body('name')
    .trim()
    .escape()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 characters'),

  body('email')
    .trim()
    .normalizeEmail()
    .isEmail().withMessage('Please provide a valid email address'),

  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/\d/).withMessage('Password must contain at least one number'),

  handleValidationErrors,
];

const validateLogin = [
  body('email')
    .trim()
    .normalizeEmail()
    .isEmail().withMessage('Please provide a valid email address'),

  body('password')
    .notEmpty().withMessage('Password is required'),

  handleValidationErrors,
];

// ─── Stock Validators ─────────────────────────────────────────────────────────
const validateStockSymbol = [
  param('symbol')
    .trim()
    .toUpperCase()
    .notEmpty().withMessage('Stock symbol is required')
    .isAlpha().withMessage('Symbol must contain only letters')
    .isLength({ min: 1, max: 10 }).withMessage('Symbol must be 1–10 characters'),

  handleValidationErrors,
];

const validatePredictionRequest = [
  body('symbol')
    .trim()
    .toUpperCase()
    .notEmpty().withMessage('Symbol is required')
    .isAlpha().withMessage('Symbol must contain only letters')
    .isLength({ min: 1, max: 10 }).withMessage('Symbol must be 1–10 characters'),

  handleValidationErrors,
];

// ─── Portfolio Validators ─────────────────────────────────────────────────────
const validateTrade = [
  body('symbol')
    .trim()
    .toUpperCase()
    .notEmpty().withMessage('Symbol is required')
    .isAlpha().withMessage('Symbol must contain only letters')
    .isLength({ min: 1, max: 10 }).withMessage('Symbol must be 1–10 characters'),

  body('quantity')
    .isFloat({ min: 0.001 }).withMessage('Quantity must be a positive number'),

  body('price')
    .isFloat({ min: 0.01 }).withMessage('Price must be greater than zero'),

  handleValidationErrors,
];

// ─── Alert Validators ─────────────────────────────────────────────────────────
const validateAlert = [
  body('symbol')
    .trim()
    .toUpperCase()
    .notEmpty().withMessage('Symbol is required')
    .isAlpha().withMessage('Symbol must contain only letters'),

  body('targetPrice')
    .isFloat({ min: 0.01 }).withMessage('Target price must be greater than zero'),

  body('type')
    .isIn(['ABOVE', 'BELOW']).withMessage('Alert type must be ABOVE or BELOW'),

  handleValidationErrors,
];

// ─── Watchlist Validators ─────────────────────────────────────────────────────
const validateWatchlistAdd = [
  body('symbol')
    .trim()
    .toUpperCase()
    .notEmpty().withMessage('Symbol is required')
    .isAlpha().withMessage('Symbol must contain only letters')
    .isLength({ min: 1, max: 10 }).withMessage('Symbol must be 1–10 characters'),

  handleValidationErrors,
];

module.exports = {
  validateRegister,
  validateLogin,
  validateStockSymbol,
  validatePredictionRequest,
  validateTrade,
  validateAlert,
  validateWatchlistAdd,
  handleValidationErrors,
};
