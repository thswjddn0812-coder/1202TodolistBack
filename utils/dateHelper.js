const getTodoDateString = (date) => date || new Date().toISOString().split('T')[0]

module.exports = getTodoDateString
    