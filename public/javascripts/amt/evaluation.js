



var iouThreshold = 0.8;
var passingThreshold = 0.6;

function submitBundle(coco) {
	var numTests = 0;
	var numPassed = 0;
	var totalTime = 0;
	for (var i = 0; i < coco.dataset.annotations.length; i++) {
		var ann = coco.dataset.annotations[i];
		totalTime += ann.current_task.annotationTime;
		if (ann.hidden_test) {
			numTests += 1;
			if (ann.current_task.type == "yesno") {
				if (evaluateYesNoTask(ann)) {
					numPassed += 1;
				}
			} else if (ann.current_task.type == "edit") {
				if (evaluateEditTask(ann)) {
					numPassed += 1;
				}
			}
		}
	}

	var results = {};
	results.passed = (numTests != 0) ? (numPassed / numTests) >= passingThreshold : true;
	results.numPassed = numPassed;
	results.numTests = numTests;
	results.totalTime = totalTime;
	results.averageTime = totalTime / coco.dataset.annotations.length;

	// Post results
	if (results.passed) {
		var bundle = removeHiddenTests(coco);
		postResults(urlParams, bundle);
	}
	showMessage(results);
}

function evaluateYesNoTask(ann) {
    var iou = computeIOU(ann["segmentation"], ann.hidden_test["segmentation"]);
    return ann.accepted == (iou > iouThreshold);
}

function evaluateEditTask(ann) {
    var iou = computeIOU(ann["segmentation"], ann.hidden_test["segmentation"]);
	return iou > iouThreshold;
}

function removeHiddenTests(coco) {
	var bundle = {};
	bundle.images = [];
	bundle.annotations = [];
	bundle.categories = [];
	bundle.bundle_info = coco.dataset.bundle_info;

	var imgIds = new Set();
	var catIds = new Set();
	for (var i = 0; i < coco.dataset.annotations.length; i++) {
		var ann = coco.dataset.annotations[i];
		if ( ! ann.hidden_test) {
			imgIds.add(ann["image_id"]);
			catIds.add(ann["category_id"]);
			bundle.annotations.push(ann);
		}
	}
	for (var i of imgIds) {
		bundle.images.push(coco.imgs[i]);
	}
	for (var i of catIds) {
		bundle.categories.push(coco.cats[i]);
	}
	return bundle;
}


function showMessage(results) {
	var alertString = "";
    if (results.passed) {
        alertString += "Thank you for your submission! ";
        alertString += "You passed " + results.numPassed + " / " + results.numTests + " hidden tests. ";
        alertString += "\n\nYou spent on average " + results.averageTime.toFixed(3) + " seconds per annotation. ";
    } else {
        alertString += "You failed! ";
        alertString += "You must pass " + passingThreshold * 100 + "% hidden tests in order to submit. ";
        alertString += "You passed " + results.numPassed + " / " + results.numTests  + " hidden tests. ";
        alertString += "Please go back and improve your score. For more information, click Instructions. ";
        alertString += "\n\nYou spent on average " + results.averageTime.toFixed(3) + " seconds per annotation. ";
    }
    alert(alertString);
}