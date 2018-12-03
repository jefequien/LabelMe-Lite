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
    var ann_source = req.query.ann_source;

    var ann_fn = dataset_name + "_" + ann_source + "_#.json";
    var ann_dir = path.join(DATA_DIR, "annotations/");
    var coco = loadCOCO(path.join(ann_dir, ann_fn));
    if (coco == null) {
        res.status(404).send('Annotation source not found');
        return;
    }
    
    var imgId = coco.fnToImgId[req.query.file_name];
    if (imgId == null) {
        res.status(404).send('File name not found');
        return;
    }

    var img = coco.imgs[imgId + 1];
    if (img == null) {
        var img = coco.imgs[0];
    }
    var response = {};
    response["file_name"] = img.file_name;
    response["dataset"] = dataset_name;
    response["ann_source"] = ann_source;
    res.json(response);
});

router.get('/images/prev', function(req, res) {
    var dataset_name = req.query.dataset;
    var ann_source = req.query.ann_source;

    var ann_fn = dataset_name + "_" + ann_source + "_#.json";
    var ann_dir = path.join(DATA_DIR, "annotations/");
    var coco = loadCOCO(path.join(ann_dir, ann_fn));
    if (coco == null) {
        res.status(404).send('Annotation source not found');
        return;
    }

    var imgId = coco.fnToImgId[req.query.file_name];
    if (imgId == null) {
        res.status(404).send('File name not found');
        return;
    }

    var img = coco.imgs[imgId - 1];
    if (img == null) {
        var img = coco.imgs[0];
    }
    var response = {};
    response["file_name"] = img.file_name;
    response["dataset"] = dataset_name;
    response["ann_source"] = ann_source;
    res.json(response);
});

router.get('/annotations', function(req, res) {
    var dataset_name = req.query.dataset;
    var ann_source = req.query.ann_source;

    var ann_fn = dataset_name + "_" + ann_source + "_#.json";
    var ann_dir = path.join(DATA_DIR, "annotations/");
    var coco = loadCOCO(path.join(ann_dir, ann_fn));
    if (coco == null) {
        res.status(404).send('Annotation source not found');
        return;
    }

    var imgId = 0
    if (req.query.file_name != null && req.query.file_name != "undefined") {
        imgId = coco.fnToImgId[req.query.file_name];
        if (imgId == null) {
            res.status(404).send('File name not found');
            return;
        }
    }

    var response = prepareResponse(coco, imgId);
    response["annotations"] = prepareAnnotations(coco, imgId);
    response["dataset"] = dataset_name;
    response["ann_source"] = ann_source;
    res.json(response);
});

router.get('/bundles', function(req, res) {
    var bundle_id = req.query.id;

    var ann_fn = bundle_id + "_#.json";
    var ann_dir = path.join(DATA_DIR, "bundles/");
    var coco = loadCOCO(path.join(ann_dir, ann_fn));
    if (coco == null) {
        res.status(404).send('Bundle not found');
        return;
    }

    var responses = [];
    for (var imgId in coco.imgs) {
        var annotations = prepareAnnotations(coco, imgId);
        for (var i = 0; i < annotations.length; i++) {
            var response = prepareResponse(coco, imgId);
            response["annotations"] = [annotations[i]];
            responses.push(response);
            if (responses.length == 100) {
                res.json(responses);
                return;
            }
        }
    }
    res.json(responses);
});

function prepareResponse(coco, imgId) {
    var file_name = coco.imgs[imgId]["file_name"];
    var dataset_name = coco.imgs[imgId]["dataset_name"];
    if ( ! dataset_name) {
        var fn = coco.ann_fn.split('/').reverse()[0];
        dataset_name = fn.split('_')[0];
    }
    var img_url = "http://places.csail.mit.edu/scaleplaces/datasets/" + path.join(getImDir(dataset_name), file_name); 
    var img_url_backup = "http://vision01.csail.mit.edu:3000/data/images?dataset=" + dataset_name + "&file_name=" + file_name; // CORS access

    var response = {};
    response["file_name"] = file_name;
    response["image_url"] = img_url;
    response["image_url_backup"] = img_url_backup;
    return response;
}
function prepareAnnotations(coco, imgId) {
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
    return annotations;
}

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
function loadCOCO(ann_fn) {
    var coco = COCOs[ann_fn];
    if (coco) {
        return coco;
    } else {
        if (fs.existsSync(ann_fn)) {
            console.time(ann_fn);
            COCOs[ann_fn] = new cocoapi.COCO(ann_fn);
            console.timeEnd(ann_fn);
        }
        return COCOs[ann_fn];
    }
}

var bundles = {};
function loadBundles() {

}

module.exports = router;
