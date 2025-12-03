const { ValidationError } = require('../utils/errorHandler');

/**
 * Joi 스키마를 사용한 요청 데이터 유효성 검사 미들웨어
 * @param {object} schema - Joi 유효성 검사 스키마
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(', ');
      return next(new ValidationError(errorMessage));
    }
    
    // req.body를 유효성 검사가 완료된 값으로 교체 (필요시 타입 변환됨)
    req.body = value;
    next();
  };
};

module.exports = validate;
