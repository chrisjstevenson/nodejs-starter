var taskSchema = require('../../models/Task');
var mongoose = require('mongoose');
var ObjectId = require('mongodb').ObjectID;

module.exports.getAll = function (req, res) {
    var Task = mongoose.model('Task', taskSchema.taskSchema)
    Task.find(function(err, tasks) {
        if (err) return console.error(err);
        res.header('content-type', contentType);
        res.render('tasks', {
                site: 'http://localhost:9002/collection/tasks/',
                items: tasks
            }
        );
    });
};

module.exports.find = function (req, res) {
    var Task = mongoose.model('Task', taskSchema.taskSchema)
    Task.findById(req.params.i, function (err, task) {
        res.header('content-type', contentType);
        res.render('item-layout', {
            site: 'http://localhost:9002/collection/tasks/' + Task._id,
            item: task
        });
    });
};

