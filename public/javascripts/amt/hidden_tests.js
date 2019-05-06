

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

function getHiddenTests(cats, callback) {
	if (cats.length == 0) {
		callback();
		return;
	}

	var catIds = [];
	for (var i = 0; i < cats.length; i++) {
		catIds.push(cats[i]["id"]);
	}
    var params = {"dataset": "ade20k", "ann_source": "instances_val_test", "cat_id": catIds};
    getAnnotations(params, function(res) {
        var hidden_tests = new COCO(res);
        callback(hidden_tests);
    });
}

function getRandomInt(max, min=0) {
	var r = Math.floor(Math.random() * (max - min)) + min;
	return r;
}
