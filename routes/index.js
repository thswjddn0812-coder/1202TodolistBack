const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.send('Hello from Express Backend!');
});

router.use('/todos', require('./todos'));

module.exports = router;
