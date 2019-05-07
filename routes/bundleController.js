var express = require('express');
var path = require('path');
var fs = require('fs');
var uuidv4 = require('uuid/v4');
var router = express.Router();

var bundlesDir = path.join(__dirname, "../bundles");
var resultsDir = path.join(__dirname, "../results");

router.get('/bundles', function(req, res) {
    var jobId = req.query.job_id;
    var jobDir = path.join(bundlesDir, jobId);
    if (! fs.existsSync(jobDir)){
        res.status(404).send('Job id not found: ' + jobId);
        return;
    }

    var bundleIds = [];
    fs.readdir(jobDir, function(err, items) {
        for (var i = 0; i < items.length; i++) {
            var bundleId = items[i].replace(".json", "");
            bundleIds.push(bundleId);
        }
        res.json(bundleIds);
    });
});

router.post('/bundles', function(req, res) {
    var jobId = req.query.job_id;
    var jobDir = path.join(bundlesDir, jobId);
    if (! fs.existsSync(jobDir)){
        fs.mkdirSync(jobDir, { recursive: true });
    }

    var bundle = req.body;
    var bundleInfo = {};
    bundleInfo.bundle_id = uuidv4();
    bundleInfo.submit_date = new Date();
    bundle.bundle_info = bundleInfo;

    var fileName = path.join(jobDir, bundleInfo.bundle_id + ".json");
    var data = JSON.stringify(bundle, null, 2);
    fs.writeFile(fileName, data, function(err) {
        if (err) {
            res.status(503).send('Could not save bundle.');
        } else {
            res.status(200).json(bundleInfo);
        }
    });
});

router.post('/results', function(req, res) {
    var jobId = req.query.job_id;
    var jobDir = path.join(resultsDir, jobId);
    if (! fs.existsSync(jobDir)){
        fs.mkdirSync(jobDir, { recursive: true });
    }

    var bundle = req.body;
    var bundleInfo = bundle.bundle_info;
    bundleInfo.submit_date = new Date();

    var fileName = path.join(jobDir, bundleInfo.bundle_id + "_" + bundleInfo.submit_date + ".json");
    var data = JSON.stringify(bundle, null, 2);
    fs.writeFile(fileName, data, function(err) {
        if (err) {
            res.status(503).send('Could not save bundle.');
        } else {
            res.status(200).json(bundleInfo);
        }
    });
});

module.exports = router;
