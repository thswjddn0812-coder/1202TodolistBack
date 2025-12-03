const prisma = require('../prisma/client');
const { ValidationError } = require('../utils/errorHandler');

class TodoService {
  // 1. 헬퍼 함수: 이건 그대로 둠 (내부 로직이라 Joi랑 무관)
  async getNextOrderIndex(model, where = {}, tx = prisma) {
    const maxItem = await tx[model].findFirst({
      where,
      orderBy: { order_index: 'desc' },
    });
    return maxItem ? maxItem.order_index + 1 : 0;
  }

  async getAllTodos(where = {}) {
    return await prisma.todos.findMany({
      where,
      include: {
        subtasks: { orderBy: { order_index: 'asc' } },
      },
      orderBy: { order_index: 'asc' },
    });
  }

  // 2. 생성: 날짜 지지고 볶는 로직 싹 사라짐!
  // Joi가 이미 date를 Date 객체로, 없으면 undefined로 넘겨줌
  async createTodo(text, date) {
    // date가 없으면 오늘 날짜, 있으면 Joi가 준 Date 객체 그대로 사용
    const targetDate = date || new Date(); 

    return await prisma.$transaction(async (tx) => {
      const order_index = await this.getNextOrderIndex('todos', { date: targetDate }, tx);

      return await tx.todos.create({
        data: {
          text,
          date: targetDate, // 훨씬 깔끔하지?
          completed: false,
          order_index,
        },
        include: { subtasks: true },
      });
    });
  }

  async updateTodo(id, data) {
    return await prisma.todos.update({
      where: { id },
      data,
      include: { subtasks: true },
    });
  }

  async deleteTodo(id) {
    await prisma.todos.delete({ where: { id } });
  }

  // 3. 순서 변경: Joi가 id랑 order_index가 '숫자'임을 보장해줬으니 안심하고 실행
  async reorderTodos(items) {
    if (!items || items.length === 0) return;
    const cases = items.map(item => `WHEN ${item.id} THEN ${item.order_index}`).join(' ');
    const ids = items.map(item => item.id).join(',');

    await prisma.$executeRawUnsafe(`
      UPDATE todos 
      SET order_index = CASE id ${cases} END 
      WHERE id IN (${ids})
    `);
  }

  async createSubtask(todoId, text) {
    const todo = await prisma.todos.findUnique({ where: { id: todoId } });
    if (!todo) throw new ValidationError('Todo not found');

    const order_index = await this.getNextOrderIndex('subtasks', { todo_id: todoId });

    return await prisma.subtasks.create({
      data: {
        todo_id: todoId,
        text,
        completed: false,
        order_index,
      },
    });
  }

  async updateSubtask(subtaskId, data) {
    return await prisma.subtasks.update({
      where: { id: subtaskId },
      data,
    });
  }

  async deleteSubtask(subtaskId) {
    await prisma.subtasks.delete({ where: { id: subtaskId } });
  }
}

module.exports = new TodoService();