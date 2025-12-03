const prisma = require('../prisma/client');
const { ValidationError } = require('../utils/errorHandler');
const getTodoDateString = require('../utils/dateHelper');

class TodoService {
  /**
   * Get next order index
   * @param {string} model 
   * @param {object} where 
   * @param {object} tx 
   */
  async getNextOrderIndex(model, where = {}, tx = prisma) {
    const maxItem = await tx[model].findFirst({
      where,
      orderBy: { order_index: 'desc' },
    });
    
    return maxItem ? maxItem.order_index + 1 : 0;
  }

  /**
   * Get all todos with subtasks
   * @param {object} where 
   */
  async getAllTodos(where = {}) {
    return await prisma.todos.findMany({
      where,
      include: {
        subtasks: {
          orderBy: { order_index: 'asc' },
        },
      },
      orderBy: { order_index: 'asc' },
    });
  }

  /**
   * Create a new todo
   * @param {string} text 
   * @param {string} date 
   */
  async createTodo(text, date) {
    const todoDate = date ? getTodoDateString(date) : new Date().toISOString().split('T')[0];

    return await prisma.$transaction(async (tx) => {
      const order_index = await this.getNextOrderIndex('todos', { date: new Date(todoDate) }, tx);

      return await tx.todos.create({
        data: {
          text,
          date: new Date(todoDate),
          completed: false,
          order_index,
        },
        include: { subtasks: true },
      });
    });
  }

  /**
   * Update a todo
   * @param {number} id 
   * @param {object} data 
   */
  async updateTodo(id, data) {
    return await prisma.todos.update({
      where: { id },
      data,
      include: { subtasks: true },
    });
  }

  /**
   * Delete a todo
   * @param {number} id 
   */
  async deleteTodo(id) {
    await prisma.todos.delete({
      where: { id },
    });
  }

  /**
   * Reorder todos
   * @param {Array} items 
   */
  async reorderTodos(items) {
    if (items.length === 0) return;

    const cases = items.map(item => `WHEN ${item.id} THEN ${item.order_index}`).join(' ');
    const ids = items.map(item => item.id).join(',');

    // Using raw query for batch update optimization
    await prisma.$executeRawUnsafe(`
      UPDATE Todos 
      SET order_index = CASE id ${cases} END 
      WHERE id IN (${ids})
    `);
  }

  /**
   * Create a subtask
   * @param {number} todoId 
   * @param {string} text 
   */
  async createSubtask(todoId, text) {
    // Verify todo exists
    const todo = await prisma.todos.findUnique({ where: { id: todoId } });
    if (!todo) {
      throw new ValidationError('Todo not found');
    }

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

  /**
   * Update a subtask
   * @param {number} subtaskId 
   * @param {object} data 
   */
  async updateSubtask(subtaskId, data) {
    return await prisma.subtasks.update({
      where: { id: subtaskId },
      data,
    });
  }

  /**
   * Delete a subtask
   * @param {number} subtaskId 
   */
  async deleteSubtask(subtaskId) {
    await prisma.subtasks.delete({
      where: { id: subtaskId },
    });
  }
}

module.exports = new TodoService();
