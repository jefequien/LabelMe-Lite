



var iouThreshold = 0.8;
var passingThreshold = 0.75;

function submitYesNoBundle(coco) {

    var results = evaluateYesNoBundle(coco, iouThreshold);
    var passed = true;
    if (results.numTests > 0) {
        passed = results.numPassed / results.numTests >= passingThreshold;
    }

    if (passed) {
        postYesNoBundle(params, coco);
        var alertString = "Thank you for your submission! ";
        alertString += "You passed " + results.numPassed + " / " + results.numTests + " hidden tests. ";
        alertString += "\n\nYou spent on average " + results.averageTime.toFixed(3) + " seconds per annotation. ";
        alert(alertString);
        return true;

    } else {
        var alertString = "You failed! ";
        alertString += "You must pass " + passingThreshold * 100 + "% hidden tests in order to submit. ";
        alertString += "You passed " + results.numPassed + " / " + results.numTests  + " hidden tests. ";
        alertString += "\n\nOnly answer Yes to annotations with IOU > " + results.iouThreshold + ". ";
        alertString += "Please go back and improve your score. We recommend the start from the beginning. For more information, click Instructions. ";
        alertString += "\n\nYou spent on average " + results.averageTime.toFixed(3) + " seconds per annotation. ";
        alert(alertString);
        return false;
    }
}


function evaluateYesNoBundle(coco, iouThreshold) {
	var results = {};
	results.iouThreshold = iouThreshold;
	results.numPassed = 0;
	results.numTests = 0;
	results.totalTime = 0;

	var anns = coco.dataset.annotations;
	for (var i = 0; i < anns.length; i++) {
		var ann = anns[i];
		if (ann.hidden_test) {
			results.numTests += 1;

			var iou = ann.hidden_test.iou;
			if (ann.accepted == iou > iouThreshold) {
				results.numPassed += 1;
			}
		}
		results.totalTime += ann.cumulativeTime;
	}

	results.averageTime = results.totalTime / anns.length;
	return results;
}

function evaluateEditBundle(coco, iouThreshold) {
	var results = {};
	results.iouThreshold = iouThreshold;
	results.numPassed = 0;
	results.numTests = 0;
	results.totalTime = 0;
	
	var totalIOU = 0;

	var anns = coco.dataset.annotations;
	for (var i = 0; i < anns.length; i++) {
		var ann = anns[i];
		if (ann.hidden_test) {
			results.numTests += 1;
			
			var iou = ann.hidden_test.iou;
			totalIOU += iou;
			if (iou > iouThreshold) {
				results.numPassed += 1;
			}
		}
		results.totalTime += ann.cumulativeTime;
	}

	results.averageTime = results.totalTime / anns.length;
	results.averageIOU = totalIOU / results.numTests;
	return results;
}