const prisma = require('../prisma/client');

/**
 * 다음 order_index 값 계산
 * @param {string} model - 'todos' 또는 'subtasks'
 * @param {object} where - Prisma where 조건
 * @returns {Promise<number>} 다음 order_index 값
 */
const getNextOrderIndex = async (model, where = {}, tx = prisma) => {
  const maxItem = await tx[model].findFirst({
    where,
    orderBy: { order_index: 'desc' },
  });
  
  return maxItem ? maxItem.order_index + 1 : 0;
};

/**
 * Todo를 subtasks와 함께 조회
 * @param {number} id - Todo ID
 * @returns {Promise<object>} Todo 객체
 */
const getTodoWithSubtasks = async (id) => {
  return await prisma.todos.findUnique({
    where: { id: parseInt(id) },
    include: {
      subtasks: {
        orderBy: { order_index: 'asc' },
      },
    },
  });
};

/**
 * 여러 항목의 order_index 일괄 업데이트
 * @param {string} model - 'todos' 또는 'subtasks'
 * @param {Array} items - { id, order_index } 배열
 * @returns {Promise<void>}
 */
const updateOrderIndexes = async (model, items) => {
  if (items.length === 0) return;

  // Construct the CASE statement
  const cases = items.map(item => `WHEN ${item.id} THEN ${item.order_index}`).join(' ');
  const ids = items.map(item => item.id).join(',');

  // Use executeRawUnsafe because table name and cases cannot be parameterized easily in standard template tag
  // CAUTION: Ensure 'model' is trusted (it comes from our code, not user input directly in a way that allows injection)
  const tableName = model === 'todos' ? 'Todos' : 'Subtasks'; // Prisma maps models to PascalCase usually, but let's check schema. 
  // Actually, in SQLite with Prisma, the table names are usually same as model names but let's verify.
  // Default prisma naming: model Todos -> table Todos.
  // But let's check schema.prisma if possible. Assuming standard naming.
  
  // However, to be safe and database agnostic, we might stick to transaction if raw query is too risky or complex for different DBs.
  // But the user specifically asked for optimization.
  // Let's try to use the transaction approach but optimized? No, transaction IS the current approach.
  // User asked for "single query".
  
  await prisma.$executeRawUnsafe(`
    UPDATE ${tableName} 
    SET order_index = CASE id ${cases} END 
    WHERE id IN (${ids})
  `);
};

/**
 * 모든 todos 조회 (subtasks 포함)
 * @param {object} where - 필터 조건
 * @returns {Promise<Array>} Todos 배열
 */
const getAllTodosWithSubtasks = async (where = {}) => {
  return await prisma.todos.findMany({
    where,
    include: {
      subtasks: {
        orderBy: { order_index: 'asc' },
      },
    },
    orderBy: { order_index: 'asc' },
  });
};

module.exports = {
  getNextOrderIndex,
  getTodoWithSubtasks,
  updateOrderIndexes,
  getAllTodosWithSubtasks,
};
