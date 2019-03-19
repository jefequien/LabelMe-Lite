var express = require('express');
var path = require('path');
var fs = require('fs');
var cocoapi = require('../public/javascripts/utils/coco');
var router = express.Router();

var DATA_DIR = path.join(__dirname, "../data");

router.get('/annotations', function(req, res) {
    var datasetName = req.query.dataset || "";
    var annSource = req.query.ann_source || "";
    var imgIds = [];
    var catIds = [];
    if (req.query.img_id) {
        imgIds = req.query.img_id.split(',').map(Number);;
    }
    if (req.query.cat_id) {
        catIds = req.query.cat_id.split(',').map(Number);;
    }

    // Get COCO
    var datasetDir = path.join(DATA_DIR, datasetName);
    var ann_fn = path.join(datasetDir, annSource + ".json");
    var coco = loadCOCO(ann_fn);
    if (coco == null) {
        res.status(404).send('Annotation file not found');
        return;
    }

    var annIds = coco.getAnnIds(imgIds, catIds);
    var anns = coco.loadAnns(annIds);

    var imgs = imgIds.length != 0 ? coco.loadImgs(imgIds) : coco.dataset.images;
    var cats = catIds.length != 0 ? coco.loadCats(catIds) : coco.dataset.categories;

    var response = {};
    response["images"] = imgs;
    response["annotations"] = anns;
    response["categories"] = cats;
    res.json(response);
});


var COCOs = {};
function loadCOCO(ann_fn) {
    var coco = COCOs[ann_fn];
    if (coco) {
        return coco;
    }

    if (fs.existsSync(ann_fn)) {
        console.time(ann_fn);

        var json = fs.readFileSync(ann_fn);
        var dataset = JSON.parse(json);
        var coco = new cocoapi.COCO(dataset);
        COCOs[ann_fn] = coco;

        console.timeEnd(ann_fn);
    }
    return COCOs[ann_fn];
}

module.exports = router;
