const express = require('express');
const router = express.Router();
const todosRouter = require('./todos');

router.get('/', (req, res) => {
  res.send('Hello from Express Backend!');
});

router.use('/todos', todosRouter);

module.exports = router;
