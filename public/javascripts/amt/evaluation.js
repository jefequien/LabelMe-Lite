


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