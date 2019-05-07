

function addHiddenTests(coco, num_tests, callback) {
	var cats = coco.dataset.categories;
	if (cats.length == 0 || num_tests == 0 ) {
		console.log("No hidden tests added.");
		callback();
		return;
	}

	var maxImgId = Math.max.apply(null, Object.keys(coco.imgs));
	var maxAnnId = Math.max.apply(null, Object.keys(coco.anns));
	getHiddenTests(cats, function(hidden_tests) {
		for (var i = 0; i < num_tests; i++) {
			var r = getRandomInt(hidden_tests.dataset.annotations.length);
			var ann = hidden_tests.dataset.annotations.splice(r, 1)[0];
			if (ann == null) {
				break;
			}

			var imgOld = hidden_tests.imgs[ann["image_id"]];
			var img = {};
			img["id"] = maxImgId + i + 1;
			img["file_name"] = imgOld["file_name"];
			img["height"] = imgOld["height"];
			img["width"] = imgOld["width"];
			ann["id"] = maxAnnId + i + 1;
			ann["image_id"] = maxImgId + i + 1;

			var r = getRandomInt(coco.dataset.annotations.length);
			coco.dataset.images.push(img);
			coco.dataset.annotations.splice(r, 0, ann);
		}
		console.log("Inserted", i, "hidden tests.");
		coco.createIndex();
		callback();
	});
}

function removeHiddenTests(coco) {
	var dataset = {};
	dataset.images = [];
	dataset.annotations = [];
	dataset.categories = [];
	dataset.bundle_info = coco.dataset.bundle_info;

	var imgIds = new Set();
	var catIds = new Set();
	for (var i = 0; i < coco.dataset.annotations.length; i++) {
		var ann = coco.dataset.annotations[i];
		if ( ! ann.hidden_test) {
			imgIds.add(ann["image_id"]);
			catIds.add(ann["category_id"]);
			dataset.annotations.push(ann);
		}
	}
	for (var i of imgIds) {
		dataset.images.push(coco.imgs[i]);
	}
	for (var i of catIds) {
		dataset.categories.push(coco.cats[i]);
	}
	return new COCO(dataset);
}

function getHiddenTests(cats, callback) {
	if (cats.length == 0) {
		callback();
		return;
	}

	var catIds = [];
	for (var i = 0; i < cats.length; i++) {
		catIds.push(cats[i]["id"]);
	}
    var params = {"dataset": "ade20k", "ann_source": "instances_val_with_hidden_tests", "cat_id": catIds};
    getAnnotations(params, function(res) {
        var hidden_tests = new COCO(res);
        callback(hidden_tests);
    });
}

function getRandomInt(max, min=0) {
	var r = Math.floor(Math.random() * (max - min)) + min;
	return r;
}
