var express = require('express');
var path = require('path');
var fs = require('fs');
var DATASETS = require('./dataset_catalog.json')
var cocoapi = require('./coco');
var router = express.Router();

var DATA_DIR = path.join(__dirname, "../data");
var IMAGE_SERVER = "http://places.csail.mit.edu/scaleplaces/datasets/"

var cocos = read_cocos();
var tasks = read_tasks();

function read_cocos() {
    var cocos = {};
    for (var project in DATASETS) {
        if (DATASETS[project]["load"]) {
            console.log("Loading", project);
            console.time("Done");
            var ann_fn = path.join(DATA_DIR, DATASETS[project]["ann_fn"]);
            var coco = new cocoapi.COCO(ann_fn);
            cocos[project] = coco;
            console.timeEnd("Done");
        }
    }
    return cocos;
}

router.get('/', function(req, res) {
    var project = req.query.project;
    var file_name = req.query.file_name;

    if (project in cocos) {
        var coco = cocos[project];
        var imgId = coco.fnToImgId[file_name];
        if (imgId) {
            var annIds = coco.getAnnIds([imgId]);
            var anns = coco.loadAnns(annIds);

            var image_url = IMAGE_SERVER + DATASETS[project]["im_dir"] + file_name;
            var annotations = [];
            for (var i = 0; i < anns.length; i++) {
                var ann = {};
                ann["category"] = coco.cats[anns[i]["category_id"]]["name"];
                ann["segmentation"] = anns[i]["segmentation"];
                annotations.push(ann);
            }

            var json = {};
            json["image_url"] = image_url;
            json["annotations"] = annotations;
            res.json(json);
        } else {
            res.status(404).send('Image not found');
        }
    } else {
        res.status(404).send('Project not found');
    }
});

/* Get task. */
router.get('/tasks', function(req, res) {
    var filename = path.join(__dirname, "../data/src/ade20k_val_annotations.json")
    var coco = cocoapi.COCO(filename);

    var task_id = req.query.id;
    var task = tasks[task_id];
    if (task) {
        res.json(task);
    } else {
        res.status(404).send('Not found');
    }
});

router.get('/bundles', function(req, res) {
    var bundle_id = req.query.id;

    var bundles_dir = path.join(DATA_DIR, "bundles");
    var file_path = path.join(bundles_dir, bundle_id + ".json");
    res.sendFile(file_path);
});


function read_tasks() {
    var filename = path.join(DATA_DIR, "tasks/tasks.json")
    var json = fs.readFileSync(filename);
    var json = JSON.parse(json);

    var tasks = {};
    for (var i = 0; i < json.length; i++){
        tasks[json[i]["task_id"]] = json[i];
    }
    return tasks;
}

module.exports = router;
