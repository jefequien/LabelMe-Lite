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

    var entries = dictionary.wordToEntries[keyword];
    if (entries == null) {
        res.status(404).send('Keyword not found: ' + keyword);
        return;
    }
    res.json(entries);
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
