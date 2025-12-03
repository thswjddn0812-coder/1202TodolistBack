const { ValidationError } = require('../utils/errorHandler');

/**
 * Middleware to validate and parse ID parameters
 * @param {string[]} paramNames - List of parameter names to validate (e.g., ['id', 'todoId'])
 */
const validateId = (paramNames = ['id']) => {
  return (req, res, next) => {
    for (const paramName of paramNames) {
      const value = req.params[paramName];
      if (value) {
        const parsed = parseInt(value, 10);
        if (isNaN(parsed)) {
          return next(new ValidationError(`Invalid ${paramName}: must be a number`));
        }
        // Replace the string param with the parsed integer
        req.params[paramName] = parsed;
      }
    }
    next();
  };
};

module.exports = validateId;
