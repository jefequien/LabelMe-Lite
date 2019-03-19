var express = require('express');
var path = require('path');
var fs = require('fs');
var dictapi = require('./dictionary');
var router = express.Router();

var info_fn = "./public/assets/openvoc_release/info.json";
var dictionary = loadDictionary(info_fn);

router.get('/definitions', function(req, res) {
    var keyword = req.query.keyword || "";
    keyword = keyword.toLowerCase().replace(" ", "_");

    var entry = dictionary.wordToEntry[keyword];
    if (entry == null) {
        res.status(404).send('Keyword not found: ' + keyword);
        return;
    }
    res.json(entry);
});

router.get('/amt_browser', function(req, res) {
    var bundle_dir = "./data/bundles";
    var prefix = "http://vision01.csail.mit.edu:3000/amt?bundle_id=";

    fs.readdir(bundle_dir, function(err, items) {
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

router.get('/yesno_browser', function(req, res) {
    var bundle_dir = "./data/bundles";
    var prefix = "http://vision01.csail.mit.edu:3000/yesno?bundle_id=";

    fs.readdir(bundle_dir, function(err, items) {
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


function loadDictionary(info_fn) {
    var dictionary = {};
    if (fs.existsSync(info_fn)) {
        var json = fs.readFileSync(info_fn);
        var dataset = JSON.parse(json);
        dictionary = new dictapi.Dictionary(dataset);
    }
    return dictionary;
}



module.exports = router;
