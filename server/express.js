var fs = require('fs');
var path = require('path');
var express = require('express');
var app = express();
var mustacheExpress = require('mustache-express');
var bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.use('/app', express.static('app'));
app.use('/node_modules', express.static('node_modules'));

app.use(require('express-custom-mime-types')({
    mimes: {
        '.lnx': 'application/lynx+json',
        '.lnxs': 'application/lynx-spec+json;content=spec'
    }
}));

app.engine('mustache', mustacheExpress());
app.set('view engine', 'mustache');
app.set('views', process.cwd() + '/out');

require('./routes')(app);

module.exports = app;