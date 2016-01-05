var mongoose = require('mongoose');

module.exports.taskSchema = mongoose.Schema({
    _id: String,
    description: String,
    completed: Boolean,
    dateCreated: Date,
    dateDue: Date
});

