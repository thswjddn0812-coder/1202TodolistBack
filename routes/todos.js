const express = require('express');
const router = express.Router();
const prisma = require('../prisma/client');
const { asyncHandler, ValidationError } = require('../utils/errorHandler');
const { 
  getNextOrderIndex, 
  getTodoWithSubtasks, 
  updateOrderIndexes,
  getAllTodosWithSubtasks 
} = require('../utils/prismaHelpers');

// GET /todos - 날짜별 필터링 지원
router.get('/', asyncHandler(async (req, res) => {
  const { date } = req.query;
  const where = date ? { date: new Date(date) } : {};
  
  const todos = await getAllTodosWithSubtasks(where);
  res.json(todos);
}));

// POST /todos - 새 할 일 생성
router.post('/', asyncHandler(async (req, res) => {
  const { text, date } = req.body;
  
  if (!text) {
    throw new ValidationError('Text is required');
  }

  const todoDate = date || new Date().toISOString().split('T')[0];
  const order_index = await getNextOrderIndex('todos', { date: new Date(todoDate) });

  const newTodo = await prisma.todos.create({
    data: {
      text,
      date: new Date(todoDate),
      completed: false,
      order_index,
    },
    include: { subtasks: true },
  });

  res.status(201).json(newTodo);
}));

// PUT /todos/reorder - Todo 순서 변경 (반드시 /:id 보다 먼저!)
router.put('/reorder', asyncHandler(async (req, res) => {
  const { todos } = req.body;

  if (!Array.isArray(todos)) {
    throw new ValidationError('Todos array is required');
  }

  await updateOrderIndexes('todos', todos);
  res.json({ success: true });
}));

// PUT /todos/:id - 할 일 수정 (완료 상태 토글)
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;

  const updatedTodo = await prisma.todos.update({
    where: { id: parseInt(id) },
    data: { completed },
    include: { subtasks: true },
  });

  res.json(updatedTodo);
}));

// DELETE /todos/:id - 할 일 삭제
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  await prisma.todos.delete({
    where: { id: parseInt(id) },
  });

  res.status(204).send();
}));

// POST /todos/:id/subtasks - 서브태스크 생성
router.post('/:id/subtasks', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;

  if (!text) {
    throw new ValidationError('Text is required');
  }

  // Todo 존재 확인
  const todo = await getTodoWithSubtasks(id);
  if (!todo) {
    throw new ValidationError('Todo not found');
  }

  const order_index = await getNextOrderIndex('subtasks', { todo_id: parseInt(id) });

  const newSubtask = await prisma.subtasks.create({
    data: {
      todo_id: parseInt(id),
      text,
      completed: false,
      order_index,
    },
  });

  res.status(201).json(newSubtask);
}));

// PUT /todos/:todoId/subtasks/:subtaskId - 서브태스크 수정
router.put('/:todoId/subtasks/:subtaskId', asyncHandler(async (req, res) => {
  const { subtaskId } = req.params;
  const { completed, text } = req.body;

  const updateData = {};
  if (completed !== undefined) updateData.completed = completed;
  if (text !== undefined) updateData.text = text;

  const updatedSubtask = await prisma.subtasks.update({
    where: { id: parseInt(subtaskId) },
    data: updateData,
  });

  res.json(updatedSubtask);
}));

// DELETE /todos/:todoId/subtasks/:subtaskId - 서브태스크 삭제
router.delete('/:todoId/subtasks/:subtaskId', asyncHandler(async (req, res) => {
  const { subtaskId } = req.params;

  await prisma.subtasks.delete({
    where: { id: parseInt(subtaskId) },
  });

  res.status(204).send();
}));

module.exports = router;


