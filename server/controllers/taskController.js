var taskSchema = require('../../models/Task');
var mongoose = require('mongoose');

module.exports.tasks = function (req, res) {
    var Task = mongoose.model('Task', taskSchema.taskSchema)
    Task.find(function(err, tasks) {
        if (err) return console.error(err);
        res.render('tasks', {
                site: 'http://localhost:9002/collection/tasks',
                items: tasks
            }
        );
    });
};