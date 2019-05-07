



var iouThreshold = 0.8;
var passingThreshold = 0.6;

function submitBundle(coco) {
	var numTests = 0;
	var numPassed = 0;
	var totalTime = 0;
	for (var i = 0; i < coco.dataset.annotations.length; i++) {
		var ann = coco.dataset.annotations[i];
		var task = ann.current_task;

		totalTime += task.annotationTime;
		if (ann.hidden_test) {
			numTests += 1;
			if (task.type == "yesno") {
				if (evaluateYesNoTask(ann)) {
					numPassed += 1;
				}
			} else if (task.type == "edit") {
				if (evaluateEditTask(ann)) {
					numPassed += 1;
				}
			}
		}
	}
	var passed = true;
	if (numTests > 0) {
		passed = (numPassed / numTests) > passingThreshold;
	}

	var results = {};
	results.passed = passed;
	results.numPassed = numPassed;
	results.numTests = numTests;
	results.totalTime = totalTime;
	results.averageTime = totalTime / coco.dataset.annotations.length;
	if (results.passed) {
		var urlParams = parseURLParams();
		postResults(urlParams, coco);
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