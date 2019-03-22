var express = require('express');
var path = require('path');
var fs = require('fs');
var router = express.Router();

var BUNDLES_DIR = path.join(__dirname, "../bundles");

router.post('/bundles', function(req, res) {
    var bundleId = req.query.bundle_id;
    var bundleType = req.query.bundle_type;
    var bundle = req.body;

    // Make output directory
    var outputDir = path.join(BUNDLES_DIR, bundleType);
    if (! fs.existsSync(outputDir)){
        fs.mkdirSync(outputDir);
    }

    // Add annotator information
    var info = {};
    info.annotator = null;
    info.submit_date = new Date();
    bundle.bundle_info = info;

    var fileName = path.join(outputDir, bundleId + ".json");
    var data = JSON.stringify(bundle, null, 2);
    fs.writeFile(fileName, data, function(err) {
        if (err) {
            res.status(503).send('Failed to save bundle ' + bundleId);
        }
        res.status(200).send('Saved bundle ' + bundleId);
    });
});

module.exports = router;
