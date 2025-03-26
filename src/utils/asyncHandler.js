/**
 * Async handler utility for express routes
 * Eliminates need for try/catch blocks in route handlers
 */

/**
 * Wraps an async function to automatically catch errors
 * and pass them to express error middleware
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;