var express = require('express');
var path = require('path');
var fs = require('fs');
var uuidv4 = require('uuid/v4');
var router = express.Router();

var bundleDir = path.join(__dirname, "../bundles");

router.get('/bundle', function(req, res) {
    var jobId = req.query.job_id;
    var bundleId = req.query.bundle_id;

    var taskDir = path.join(bundleDir, jobId , "task");
    var fileName = path.join(taskDir, bundleId + ".json");
    res.sendFile(fileName);
});

router.get('/bundles', function(req, res) {
    var jobId = req.query.job_id;

    var taskDir = path.join(bundleDir, jobId , "task");
    if (! fs.existsSync(taskDir)){
        res.status(404).send('Job id not found: ' + jobId);
        return;
    }

    var bundleIds = [];
    fs.readdir(taskDir, function(err, items) {
        for (var i = 0; i < items.length; i++) {
            var bundleId = items[i].replace(".json", "");
            bundleIds.push(bundleId);
        }
        res.json(bundleIds);
    });
});

router.post('/bundles', function(req, res) {
    var jobId = req.query.job_id;
    var bundle = req.body;

    // Bundle info
    var bundleInfo = bundle.bundle_info;
    if (bundleInfo == null) {
        bundleInfo = {};
        bundleInfo.bundle_type = "task";
        bundleInfo.bundle_id = uuidv4();
        bundle.bundle_info = bundleInfo;
    }
    bundleInfo.submit_date = new Date();

    var taskDir = path.join(bundleDir, jobId, bundleInfo.bundle_type);
    if (! fs.existsSync(taskDir)){
        fs.mkdirSync(taskDir, { recursive: true });
    }

    var fileName = path.join(taskDir, bundleInfo.bundle_id + ".json");
    var data = JSON.stringify(bundle, null, 2);
    fs.writeFile(fileName, data, function(err) {
        if (err) {
            res.status(503).send('Failed to save bundle.');
        }
        res.status(200).json({"bundle_info" : bundle.bundle_info});
    });
});

module.exports = router;
