const logger = require('../logger');

/**
 * Global error handler middleware.
 *
 * Operational errors (statusCode 4xx set on the error object) are returned
 * with their message. Unexpected errors (5xx) log the full stack but only
 * return a generic message so internals are never exposed in production.
 *
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next
 */
function errorHandler(err, req, res, _next) {
  const statusCode = Number.isInteger(err.statusCode) && err.statusCode >= 400 && err.statusCode < 600
    ? err.statusCode
    : 500;

  const isOperational = statusCode >= 400 && statusCode < 500;

  logger.error('unhandled error', {
    requestId: req.requestId,
    message: err.message,
    stack: err.stack,
    statusCode,
  });

  const body = {
    error: isOperational ? err.message : 'Internal Server Error',
    requestId: req.requestId,
  };

  res.status(statusCode).json(body);
}

module.exports = errorHandler;
