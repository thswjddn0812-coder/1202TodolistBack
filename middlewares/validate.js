const { ValidationError } = require('../utils/errorHandler');

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(', ');
      return next(new ValidationError(errorMessage));
    }
    
    // Replace req.body with validated value (converts types if needed)
    req.body = value;
    next();
  };
};

module.exports = validate;
