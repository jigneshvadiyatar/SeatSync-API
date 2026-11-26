
/**
 * Creates a typed application error with an HTTP status code.
 * Use this shared helper instead of duplicating error factories in every service.
 *
 * @param {string} message - Human-readable error message.
 * @param {number} statusCode - HTTP status code (4xx or 5xx).
 * @returns {Error}
 */
const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export { createError };
