const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../utils/errorHandler');
const todoService = require('../services/todoService');
const validate = require('../middlewares/validate');
const validateId = require('../middleware/validateId');
const { 
  createTodoSchema, 
  updateTodoSchema, 
  createSubtaskSchema, 
  updateSubtaskSchema, 
  reorderTodosSchema 
} = require('../validators/todoValidator');

// GET /todos - 날짜별 필터링 지원
router.get('/', asyncHandler(async (req, res) => {
  const { date } = req.query;
  const where = date ? { date: new Date(date) } : {};
  
  const todos = await todoService.getAllTodos(where);
  res.json(todos);
}));

// POST /todos - 새 할 일 생성
router.post('/', validate(createTodoSchema), asyncHandler(async (req, res) => {
  const { text, date } = req.body;
  const newTodo = await todoService.createTodo(text, date);
  res.status(201).json(newTodo);
}));

// PUT /todos/reorder - Todo 순서 변경
router.put('/reorder', validate(reorderTodosSchema), asyncHandler(async (req, res) => {
  const { todos } = req.body;
  await todoService.reorderTodos(todos);
  res.json({ success: true });
}));

// PATCH /todos/:id - 할 일 수정 (완료 상태 토글)
router.patch('/:id', validateId(['id']), validate(updateTodoSchema), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updatedTodo = await todoService.updateTodo(id, req.body);
  res.json(updatedTodo);
}));

// DELETE /todos/:id - 할 일 삭제
router.delete('/:id', validateId(['id']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  await todoService.deleteTodo(id);
  res.status(204).send();
}));

// POST /todos/:id/subtasks - 서브태스크 생성
router.post('/:id/subtasks', validateId(['id']), validate(createSubtaskSchema), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  const newSubtask = await todoService.createSubtask(id, text);
  res.status(201).json(newSubtask);
}));

// PATCH /todos/:todoId/subtasks/:subtaskId - 서브태스크 수정
router.patch('/:todoId/subtasks/:subtaskId', validateId(['todoId', 'subtaskId']), validate(updateSubtaskSchema), asyncHandler(async (req, res) => {
  const { subtaskId } = req.params;
  const updatedSubtask = await todoService.updateSubtask(subtaskId, req.body);
  res.json(updatedSubtask);
}));

// DELETE /todos/:todoId/subtasks/:subtaskId - 서브태스크 삭제
router.delete('/:todoId/subtasks/:subtaskId', validateId(['todoId', 'subtaskId']), asyncHandler(async (req, res) => {
  const { subtaskId } = req.params;
  await todoService.deleteSubtask(subtaskId);
  res.status(204).send();
}));

module.exports = router;
