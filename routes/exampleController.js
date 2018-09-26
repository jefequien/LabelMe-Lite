var express = require('express');
var path = require('path');
var fs = require('fs');
var router = express.Router();

/* Exposes examples. */
router.get('/', function(req, res) {
    var example_dir = path.join(__dirname, "../examples");
    var filename = req.query.filename;

    file_path = path.join(example_dir, filename);
    res.sendFile(file_path);
});

module.exports = router;
