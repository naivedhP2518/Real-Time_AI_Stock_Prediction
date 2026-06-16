/**
 * @file errorHandler.js
 * @description Centralized error handling middleware.
 *              Differentiates between operational and programming errors.
 *              Sends sanitized responses in production, full stack in dev.
 */

const logger = require('../utils/logger');

// ─── Custom Application Error Class ──────────────────────────────────────────
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── 404 Not Found Handler ────────────────────────────────────────────────────
const notFound = (req, res, next) => {
  const error = new AppError(`Route not found: ${req.originalUrl}`, 404);
  next(error);
};

// ─── JWT / Auth Error Handlers ────────────────────────────────────────────────
const handleJWTError = () =>
  new AppError('Invalid token. Please log in again.', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired. Please log in again.', 401);

const handleCastError = (err) =>
  new AppError(`Invalid ${err.path}: ${err.value}`, 400);

const handleDuplicateFieldsError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return new AppError(`Duplicate value for field: ${field}. Please use another value.`, 400);
};

const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  return new AppError(`Validation failed: ${errors.join('. ')}`, 400);
};

// ─── Response Senders ─────────────────────────────────────────────────────────
const sendErrorDev = (err, req, res) => {
  logger.error(`[DEV ERROR] ${err.message}`, {
    url: req.originalUrl,
    method: req.method,
    status: err.statusCode,
    stack: err.stack,
  });

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err,
  });
};

const sendErrorProd = (err, req, res) => {
  if (err.isOperational) {
    // Trusted, operational error — send message to client
    logger.warn(`[OPERATIONAL ERROR] ${err.message}`, {
      url: req.originalUrl,
      method: req.method,
      status: err.statusCode,
      userId: req.user?._id,
    });

    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  // Programming or unknown error — don't leak details
  logger.error(`[UNKNOWN ERROR] ${err.message}`, {
    url: req.originalUrl,
    method: req.method,
    stack: err.stack,
    userId: req.user?._id,
  });

  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong on our end. Please try again later.',
  });
};

// ─── Global Error Middleware ──────────────────────────────────────────────────
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else {
    let error = { ...err, message: err.message };

    if (err.name === 'CastError') error = handleCastError(err);
    if (err.code === 11000) error = handleDuplicateFieldsError(err);
    if (err.name === 'ValidationError') error = handleValidationError(err);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};

module.exports = { AppError, notFound, globalErrorHandler };
