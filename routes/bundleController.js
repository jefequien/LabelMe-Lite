var express = require('express');
var path = require('path');
var fs = require('fs');
var uuidv4 = require('uuid/v4');
var router = express.Router();

var bundles_dir = path.join(__dirname, "../bundles");

router.get('/bundles_list', function(req, res) {
    // Make output directory
    var out_dir = path.join(bundles_dir, "tasks");
    if (! fs.existsSync(out_dir)){
        fs.mkdirSync(out_dir, { recursive: true });
    }

    var bundles_list = [];
    fs.readdir(out_dir, function(err, items) {
        for (var i = 0; i < items.length; i++) {
            var bundle_id = items[i].replace(".json", "");
            bundles_list.push(bundle_id);
        }
        res.json(bundles_list);
    });
});

router.post('/bundles', function(req, res) {
    var bundle = req.body;
    var bundleType = req.query.bundle_type || "tasks";

    // Make output directory
    var out_dir = path.join(bundles_dir, bundleType);
    if (! fs.existsSync(out_dir)){
        fs.mkdirSync(out_dir, { recursive: true });
    }

    // Bundle info
    if (bundle.bundle_info == null) {
        bundle.bundle_info = {};
        bundle.bundle_info.bundle_id = uuidv4();
    }
    bundle.bundle_info.submit_date = new Date();

    var fileName = path.join(out_dir, bundle.bundle_info.bundle_id + ".json");
    var data = JSON.stringify(bundle, null, 2);
    fs.writeFile(fileName, data, function(err) {
        if (err) {
            res.status(503).send('Failed to save bundle.');
        }
        res.status(200).json({"bundle_info" : bundle.bundle_info});
    });
});

module.exports = router;
