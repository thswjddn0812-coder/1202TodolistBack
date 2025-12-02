const prisma = require('../prisma/client');

/**
 * 다음 order_index 값 계산
 * @param {string} model - 'todos' 또는 'subtasks'
 * @param {object} where - Prisma where 조건
 * @returns {Promise<number>} 다음 order_index 값
 */
const getNextOrderIndex = async (model, where = {}) => {
  const maxItem = await prisma[model].findFirst({
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
  await prisma.$transaction(
    items.map((item) =>
      prisma[model].update({
        where: { id: item.id },
        data: { order_index: item.order_index },
      })
    )
  );
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
