var urls = require("../../tools/build/urls");
var handlebars = require('handlebars');

module.exports.index = function (req, res) {
    res.render('default', {
        urls: urls.data,
        sku: {
            value: '',
            requiredState: 'unknown',
            textState: 'unknown'
        },
        zipCode: {
            value: '',
            requiredState: 'unknown',
            textState: 'unknown'
        }
    }, function(err, lynx) {
        res.set("content-type", "application/lynx+json");
        res.status(200);
        res.send(lynx);
    });
}