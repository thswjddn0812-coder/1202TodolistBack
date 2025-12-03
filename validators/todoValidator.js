const Joi = require('joi');

const createTodoSchema = Joi.object({
  text: Joi.string().required().messages({
    'string.empty': 'Text is required',
    'any.required': 'Text is required',
  }),
  date: Joi.string().isoDate().optional(),
});

const updateTodoSchema = Joi.object({
  completed: Joi.boolean().required(),
});

const createSubtaskSchema = Joi.object({
  text: Joi.string().required().messages({
    'string.empty': 'Text is required',
    'any.required': 'Text is required',
  }),
});

const updateSubtaskSchema = Joi.object({
  completed: Joi.boolean().optional(),
  text: Joi.string().optional(),
}).min(1); // At least one field must be present

const reorderTodosSchema = Joi.object({
  todos: Joi.array().items(
    Joi.object({
      id: Joi.number().required(),
      order_index: Joi.number().required(),
    })
  ).required().messages({
    'array.base': 'Todos array is required',
    'any.required': 'Todos array is required',
  }),
});

module.exports = {
  createTodoSchema,
  updateTodoSchema,
  createSubtaskSchema,
  updateSubtaskSchema,
  reorderTodosSchema,
};
