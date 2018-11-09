var express = require('express');
var path = require('path');
var fs = require('fs');
var cocoapi = require('./coco');
var router = express.Router();

var DATA_DIR = path.join(__dirname, "../data");

router.get('/images', function(req, res) {
    var dataset_name = req.query.dataset;
    var file_name = req.query.file_name;

    var im_dir = path.join(DATA_DIR, getImDir(dataset_name));
    if (im_dir == null) {
        res.status(404).send('Dataset name not found');
        return;
    }

    var im_path = path.join(im_dir, file_name);
    res.sendFile(im_path);
});

router.get('/images/next', function(req, res) {
    var dataset_name = req.query.dataset;
    var file_name = req.query.file_name;
    var ann_source = req.query.ann_source;

    var coco = loadCOCO(dataset_name, ann_source);
    if (coco == null) {
        res.status(404).send('Annotation source not found');
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
    response["dataset"] = dataset_name;
    response["file_name"] = img.file_name;
    response["ann_source"] = ann_source;
    res.json(response);
});

router.get('/images/prev', function(req, res) {
    var dataset_name = req.query.dataset;
    var file_name = req.query.file_name;
    var ann_source = req.query.ann_source;

    var coco = loadCOCO(dataset_name, ann_source);
    if (coco == null) {
        res.status(404).send('Annotation source not found');
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
    response["dataset"] = dataset_name;
    response["file_name"] = img.file_name;
    response["ann_source"] = ann_source;
    res.json(response);
});

router.get('/annotations', function(req, res) {
    var dataset_name = req.query.dataset;
    var file_name = req.query.file_name;
    var ann_source = req.query.ann_source;

    var coco = loadCOCO(dataset_name, ann_source);
    if (coco == null) {
        res.status(404).send('Annotation source not found');
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
        var catId = anns[i]["category_id"];
        var segm = anns[i]["segmentation"];
        var score = anns[i]["score"];
        var iscrowd = anns[i]["iscrowd"];
        
        var name = catId;
        if (coco.cats[catId]) {
            name = coco.cats[catId]["name"];
        }
        if (score != null) {
            name = name + " " + score.toFixed(3);
            if (score < 0.5) {
                continue;
            }
        }
        if (iscrowd == 1) {
            name = name + " (crowd)";
        }
        
        var ann = {};
        ann["category"] = name;
        ann["segmentation"] = segm;
        annotations.push(ann);
    }
    
    var img_url = "http://vision01.csail.mit.edu:3000/data/images?dataset=" + dataset_name + "&file_name=" + file_name;
    var img_url_backup = "http://places.csail.mit.edu/scaleplaces/datasets/" + path.join(getImDir(dataset_name), file_name); // No CORS access

    var response = {};
    response["dataset"] = dataset_name;
    response["file_name"] = file_name;
    response["ann_source"] = ann_source;
    response["annotations"] = annotations;
    response["image_url"] = img_url;
    response["image_url_backup"] = img_url_backup;
    res.json(response);
});

router.get('/bundles', function(req, res) {
    var bundle_id = req.query.id;

    var bundles_dir = path.join(DATA_DIR, "bundles");
    var file_path = path.join(bundles_dir, bundle_id + ".json");
    res.sendFile(file_path);
});

function getImDir(dataset_name) {
    if (dataset_name.includes('ade')) {
        return "ade20k/images/";
    } else if (dataset_name.includes('coco')) {
        return "coco/images/";
    } else if (dataset_name.includes('places')) {
        return "places/images/";
    } else {
        return null;
    }
}

var COCOs = {};
function loadCOCO(dataset_name, ann_source) {
    var proj_name = dataset_name + "_" + ann_source;
    var coco = COCOs[proj_name];
    if (coco) {
        return coco;
    } else {
        var ann_fn = path.join(DATA_DIR, "annotations/" + proj_name + "_#.json");
        if (fs.existsSync(ann_fn)) {
            console.time(proj_name);
            COCOs[proj_name] = new cocoapi.COCO(ann_fn);
            console.timeEnd(proj_name);
        }
        return COCOs[proj_name];
    }
}

var bundles = {};
function loadBundles() {

}

module.exports = router;
