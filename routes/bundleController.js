var express = require('express');
var path = require('path');
var fs = require('fs');
var uuidv4 = require('uuid/v4');
var router = express.Router();

var BUNDLES_DIR = path.join(__dirname, "../bundles");

router.post('/bundles', function(req, res) {
    var bundle = req.body;
    var bundleType = req.query.bundle_type || "tasks";

    // Make output directory
    var outputDir = path.join(BUNDLES_DIR, bundleType);
    if (! fs.existsSync(outputDir)){
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Bundle info
    if (bundle.bundle_info == null) {
        bundle.bundle_info = {};
        bundle.bundle_info.bundle_id = uuidv4();
    }
    bundle.bundle_info.submit_date = new Date();

    var fileName = path.join(outputDir, bundle.bundle_info.bundle_id + ".json");
    var data = JSON.stringify(bundle, null, 2);
    fs.writeFile(fileName, data, function(err) {
        if (err) {
            res.status(503).send('Failed to save bundle.');
        }
        res.status(200).json({"bundle_info" : bundle.bundle_info});
    });
});

module.exports = router;
