


function evaluateYesNoBundle(coco, iouThreshold, passingThreshold) {
	var results = {};
	results.numPassed = 0;
	results.numFailed = 0;
	results.numTests = 0;
	results.iouThreshold = iouThreshold;
	results.passingThreshold = passingThreshold;
	results.totalTime = 0;

	var anns = coco.dataset.annotations;
	for (var i = 0; i < anns.length; i++) {
		var ann = anns[i];
		if (ann.gt_segmentation) {
			results.numTests += 1;
			var shouldAccept = ann.iou > iouThreshold;
			if (ann.accepted == shouldAccept) {
				results.numPassed += 1;
			} else {
				results.numFailed += 1;
			}
		}
		results.totalTime += ann.cumulativeTime;
	}

	results.passed = (results.numPassed / results.numTests > passingThreshold);
	results.averageTime = results.totalTime / anns.length;
	return results;
}

function evaluateEditBundle(coco) {
	var results = {};
	results.passed = true;
	return results;
}