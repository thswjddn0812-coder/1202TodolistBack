const { ValidationError } = require('../utils/errorHandler');

/**
 * ID 파라미터 유효성 검사 및 파싱 미들웨어
 * @param {string[]} paramNames - 검증할 파라미터 이름 목록 (예: ['id', 'todoId'])
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
        // 문자열 파라미터를 파싱된 정수로 교체
        req.params[paramName] = parsed;
      }
    }
    next();
  };
};

module.exports = validateId;
