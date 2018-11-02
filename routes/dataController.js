var express = require('express');
var path = require('path');
var fs = require('fs');
var cocoapi = require('./coco');
var router = express.Router();

var DATA_DIR = path.join(__dirname, "../data");

router.get('/images', function(req, res) {
    var proj_name = req.query.proj_name;
    var file_name = req.query.file_name;

    var im_dir = path.join(DATA_DIR, getImDir(proj_name));
    if (im_dir == null) {
        res.status(404).send('Project name not found');
        return;
    }

    var im_path = path.join(im_dir, file_name);
    res.sendFile(im_path);
});

router.get('/images/next', function(req, res) {
    var proj_name = req.query.proj_name;
    var file_name = req.query.file_name;

    var coco = loadCOCO(proj_name);
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

    var coco = loadCOCO(proj_name);
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

    var coco = loadCOCO(proj_name);
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
    // No CORS access
    var img_url = "http://places.csail.mit.edu/scaleplaces/datasets/" + path.join(getImDir(proj_name), file_name);

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

function getImDir(proj_name) {
    if (proj_name.includes('ade')) {
        return "ade20k/images/";
    } else if (proj_name.includes('coco') || proj_name.includes('2017')) {
        return "coco/images/";
    } else if (proj_name.includes('places')) {
        return "places/images/";
    } else {
        return null;
    }
}

var COCOs = {};
function loadCOCO(proj_name) {
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
