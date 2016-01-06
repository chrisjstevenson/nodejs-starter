var viewController = require('./controllers/viewController');
var taskController = require('./controllers/taskController');

module.exports = function (app) {
    app.get('/', viewController.index);
    app.get('/collection/tasks', taskController.getAll);
    app.get('/collection/tasks/:i', taskController.find);
};

