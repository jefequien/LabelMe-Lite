var express = require('express');
var path = require('path');
var fs = require('fs');
var router = express.Router();

/* GET home page. */
router.get('/tool', function(req, res, next) {
  res.render('full', { title: 'LabelMe-Lite' });
});

router.get('/', function(req, res, next) {
  res.redirect('tool');
});

router.get('/amt_edit', function(req, res, next) {
  res.render('amt_edit', { title: 'Amazon Mechanical Turk Edit Interface' });
});

router.get('/amt_yesno', function(req, res, next) {
  res.render('amt_yesno', { title: 'Amazon Mechanical Turk YesNo Interface' });
});

router.get('/amt_edit/browser', function(req, res) {
    // var prefix = "http://localhost:3000/amt_edit?bundle_id=";
    var prefix = "http://vision01.csail.mit.edu:3000/amt_edit?bundle_id=";

	var BUNDLES_DIR = path.join(__dirname, "../bundles");
    var task_dir = path.join(BUNDLES_DIR, "tasks");
    fs.readdir(task_dir, function(err, items) {
        var html = "";
        for (var i = 0; i < items.length; i++) {
            var bundle_id = items[i].replace(".json", "");
            var link = prefix + bundle_id;
            var href = "<a href=\"" + link + "\" target=\"_blank\">" + link + "</a> <br>";
            html += href;
        }
        res.send(html);
    });
});

router.get('/amt_yesno/browser', function(req, res) {
    // var prefix = "http://localhost:3000/amt_yesno?bundle_id=";
    var prefix = "http://vision01.csail.mit.edu:3000/amt_yesno?bundle_id=";

	var BUNDLES_DIR = path.join(__dirname, "../bundles");
    var task_dir = path.join(BUNDLES_DIR, "tasks");
    fs.readdir(task_dir, function(err, items) {
        var html = "";
        for (var i = 0; i < items.length; i++) {
            var bundle_id = items[i].replace(".json", "");
            var link = prefix + bundle_id;
            var href = "<a href=\"" + link + "\" target=\"_blank\">" + link + "</a> <br>";
            html += href;
        }
        res.send(html);
    });
});

module.exports = router;
