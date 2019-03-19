

function COCO(dataset) {
    this.dataset = dataset;
    this.anns = {};
    this.cats = {};
    this.imgs = {};

    this.imgToAnns = {};
    this.catToImgs = {};
    this.fnToImgId = {};

    if (dataset) {
        this.createIndex();
    }
}

COCO.prototype.createIndex = function () {
    if ("annotations" in this.dataset) {
        for (var i = 0; i < this.dataset["annotations"].length; i++) {
            var ann = this.dataset["annotations"][i];
            if (ann["image_id"] in this.imgToAnns) {
                this.imgToAnns[ann["image_id"]].push(ann);
            } else {
                this.imgToAnns[ann["image_id"]] = [ann]
            }
            this.anns[ann["id"]] = ann;
        }
    }

    if ("images" in this.dataset) {
        for (var i = 0; i < this.dataset["images"].length; i++) {
            var img = this.dataset["images"][i];
            this.imgs[img["id"]] = img;
            this.fnToImgId[img["file_name"]] = img["id"];
        }
    }

    if ("categories" in this.dataset) {
        for (var i = 0; i < this.dataset["categories"].length; i++) {
            var cat = this.dataset["categories"][i];
            this.cats[cat["id"]] = cat;
        }
    }

    if ("annotations" in this.dataset && "categories" in this.dataset) {
        for (var i = 0; i < this.dataset["annotations"].length; i++) {
            var ann = this.dataset["annotations"][i];
            if (ann["category_id"] in this.catToImgs) {
                this.catToImgs[ann["category_id"]].push(ann["image_id"]);
            } else {
                this.catToImgs[ann["category_id"]] = [ann["image_id"]];
            }
        }
    }
}

COCO.prototype.getAnnIds = function (imgIds=[], catIds=[]) {
    var anns = [];

    // Get anns
    if (imgIds.length != 0) {
        for (var i = 0; i < imgIds.length; i++) {
            var imgId = imgIds[i];
            if (imgId in this.imgToAnns) {
                anns = anns.concat(this.imgToAnns[imgId]);
            }
        }
    } else {
        anns = this.dataset.annotations;
    }

    // Filter categories
    if (catIds.length != 0) {
        var filtered = [];
        for (var i = 0; i < anns.length; i++) {
            var ann = anns[i];
            if (catIds.indexOf(ann["category_id"]) >= 0) {
                filtered.push(ann);
            }
        }
        anns = filtered;
    }

    // Get annIds
    var ids = [];
    for (var i = 0; i < anns.length; i++) {
        ids.push(anns[i]["id"]);
    }
    return ids;
}

COCO.prototype.getCatIds = function (catNms=[], supNms=[], catIds=[]) {
    return [];
}
COCO.prototype.getImgIds = function (imgIds=[], catIds=[]) {
    return [];
}

COCO.prototype.loadAnns = function (ids=[]) {
    var anns = [];
    for (var i = 0; i < ids.length; i++) {
        anns.push(this.anns[ids[i]]);
    }
    return anns;
}
COCO.prototype.loadImgs = function (ids=[]) {
    var imgs = [];
    for (var i = 0; i < ids.length; i++) {
        imgs.push(this.imgs[ids[i]]);
    }
    return imgs;
}
COCO.prototype.loadCats = function (ids=[]) {
    var cats = [];
    for (var i = 0; i < ids.length; i++) {
        cats.push(this.cats[ids[i]]);
    }
    return cats;
}

try {
    module.exports = {
        COCO: COCO
    }
} catch (e) {}
