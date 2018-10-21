var express = require('express');
var path = require('path');
var fs = require('fs');
var cocoapi = require('./coco');
var router = express.Router();

var DATA_DIR = path.join(__dirname, "../data");
var DATASETS = require('./dataset_catalog.json');

var datasets = loadDatasets();
var bundles = loadBundles();

router.get('/images', function(req, res) {
    var proj_name = req.query.proj_name;
    var file_name = req.query.file_name;

    var img_dir = path.join(DATA_DIR, DATASETS[proj_name].im_dir);
    var img_path = path.join(img_dir, file_name);
    res.sendFile(img_path);
});

router.get('/images/next', function(req, res) {
    var proj_name = req.query.proj_name;
    var file_name = req.query.file_name;

    var coco = datasets[proj_name];
    if (coco == null) {
        res.status(404).send('Project name not found');
        return;
    }
    var imgId = coco.fnToImgId[file_name];
    if (imgId == null) {
        res.status(404).send('File name not found');
        return;
    }

    var img = coco.imgs[imgId + 1];
    if (img == null) {
        var img = coco.imgs[0];
    }
    var response = {};
    response["proj_name"] = proj_name;
    response["file_name"] = img.file_name;
    res.json(response);
});

router.get('/images/prev', function(req, res) {
    var proj_name = req.query.proj_name;
    var file_name = req.query.file_name;

    var coco = datasets[proj_name];
    if (coco == null) {
        res.status(404).send('Project name not found');
        return;
    }
    var imgId = coco.fnToImgId[file_name];
    if (imgId == null) {
        res.status(404).send('File name not found');
        return;
    }

    var img = coco.imgs[imgId - 1];
    if (img == null) {
        var img = coco.imgs[0];
    }
    var response = {};
    response["proj_name"] = proj_name;
    response["file_name"] = img.file_name;
    res.json(response);
});

router.get('/annotations', function(req, res) {
    var proj_name = req.query.proj_name;
    var file_name = req.query.file_name;

    var coco = datasets[proj_name];
    if (coco == null) {
        res.status(404).send('Project name not found');
        return;
    }
    var imgId = coco.fnToImgId[file_name];
    if (imgId == null) {
        res.status(404).send('File name not found');
        return;
    }

    // Prepare annotations
    var annIds = coco.getAnnIds([imgId]);
    var anns = coco.loadAnns(annIds);
    var annotations = [];
    for (var i = 0; i < anns.length; i++) {
        var name = coco.cats[anns[i]["category_id"]]["name"];
        var segm = anns[i]["segmentation"];
        var score = anns[i]["score"];

        if (score != null) {
            name = name + " " + score.toFixed(3);
            if (score < 0.5) {
                continue;
            }
        }

        var ann = {};
        ann["category"] = name;
        ann["segmentation"] = segm;
        annotations.push(ann);
    }

    // No CORS access
    var img_url = "http://places.csail.mit.edu/scaleplaces/datasets/" + DATASETS[proj_name].im_dir + file_name;

    var response = {};
    response["proj_name"] = proj_name;
    response["file_name"] = file_name;
    response["image_url"] = img_url;
    response["annotations"] = annotations;
    res.json(response);
});

router.get('/bundles', function(req, res) {
    var bundle_id = req.query.id;

    var bundles_dir = path.join(DATA_DIR, "bundles");
    var file_path = path.join(bundles_dir, bundle_id + ".json");
    res.sendFile(file_path);
});

function loadDatasets() {
    var datasets = {};
    for (var proj_name in DATASETS) {
        if (DATASETS[proj_name]["load"]) {
            console.time(proj_name);
            var ann_fn = path.join(DATA_DIR, DATASETS[proj_name].ann_fn);
            var coco = new cocoapi.COCO(ann_fn);
            datasets[proj_name] = coco;
            console.timeEnd(proj_name);
        }
    }
    return datasets;
}
function loadBundles() {

}

module.exports = router;
