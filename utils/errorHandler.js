/**
 * 공통 에러 핸들러
 * Prisma 에러 코드를 자동으로 처리하고 일관된 응답 형식 제공
 */

const handlePrismaError = (error) => {
  // Prisma 에러 코드 처리
  switch (error.code) {
    case 'P2025':
      return { status: 404, message: 'Resource not found' };
    case 'P2002':
      return { status: 409, message: 'Duplicate entry' };
    case 'P2003':
      return { status: 400, message: 'Foreign key constraint failed' };
    default:
      return { status: 500, message: 'Internal server error' };
  }
};

/**
 * 비동기 라우트 핸들러 래퍼
 * try-catch를 자동으로 처리
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      console.error('Error:', error);
      
      if (error.code && error.code.startsWith('P')) {
        // Prisma 에러
        const { status, message } = handlePrismaError(error);
        return res.status(status).json({ error: message });
      }
      
      // 일반 에러
      res.status(500).json({ error: error.message || 'Internal server error' });
    });
  };
};

/**
 * 입력 검증 에러 생성
 */
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
  }
}

module.exports = {
  asyncHandler,
  ValidationError,
  handlePrismaError,
};
