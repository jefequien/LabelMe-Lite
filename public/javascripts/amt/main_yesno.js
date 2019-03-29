
var params = parseURLParams();
if (Object.keys(params).length == 0) {
    // Default params
    params.bundle_id = "0202ba55407e420fa40964c2812edfbb";
    setURLParams(params);
}

var coco = new COCO();
var current_num = 0;

var iouThreshold = 0.8;
var passingThreshold = 0.75;
var trainingMode = params.training_mode == "true";

window.onload = function() {
    getBundle(params, function(res) {
        console.log("Bundle:", res);
        coco = new COCO(res);
        loadInterface(coco, current_num);
    });
}

function loadInterface(coco, current_num) {
    loadInstructions(coco, current_num, trainingMode);
    setDefaultAnswer(coco, current_num);
    updateSubmitButton(coco, current_num);

    loadYNTool(coco, current_num, panels=2, showGt=trainingMode);
    startTimer(coco, current_num);
}

function nextImage() {
    var anns = coco.dataset.annotations;
    if (current_num < anns.length - 1) {
        endTimer(coco, current_num);
        current_num += 1;
        loadInterface(coco, current_num);
    }
}
function prevImage() {
    if (current_num > 0) {
        endTimer(coco, current_num);
        current_num -= 1;
        loadInterface(coco, current_num);
    }
}
function submitResults() {
    endTimer(coco, current_num);

    var results = evaluateYesNoBundle(coco, iouThreshold);
    var passed = results.numPassed / results.numTests >= passingThreshold;

    if (passed) {
        postYesNoBundle(params, coco);
        var alertString = "Thank you for your submission! ";
        alertString += "You passed " + results.numPassed + " / " + results.numTests + " hidden tests. ";
        alertString += "\n\nYou spent on average " + results.averageTime.toFixed(3) + " seconds per annotation. ";
        alert(alertString);

        redirectToYesNoBrowser();

    } else {
        var alertString = "You failed! ";
        alertString += "You must pass " + passingThreshold * 100 + "% hidden tests in order to submit. ";
        alertString += "You passed " + results.numPassed + " / " + results.numTests  + " hidden tests. ";
        alertString += "\n\nOnly answer Yes to annotations with IOU > " + results.iouThreshold + ". ";
        alertString += "\n\nPlease go back and improve your score. We recommend the start from the beginning. For more information, click Instructions. ";
        alertString += "\n\nYou spent on average " + results.averageTime.toFixed(3) + " seconds per annotation. ";
        alert(alertString);
    }

    startTimer(coco, current_num);
}
function updateSubmitButton(coco, current_num) {
    var anns = coco.dataset.annotations;
    var images_left = 0;
    for (var i = 0; i < anns.length; i++) {
        if (anns[i]["accepted"] == null) {
            images_left += 1;
        }
    }

    $("#submitButton").html("Submit (" + images_left + " images left)"); 
    $("#submitButton").prop('disabled', true); 
    if (images_left == 0) {
        $("#submitButton").html("Submit"); 
        $("#submitButton").prop('disabled', false); 
    }
    if (trainingMode) {
        $("#submitButton").html("Training Mode (" + images_left + " images left)");
        $("#submitButton").prop('disabled', true); 
    }
}
function setDefaultAnswer(coco, current_num) {
    var ann = coco.dataset.annotations[current_num];
    if (ann["accepted"] == null) {
        ann["accepted"] = false;
    }

    if (trainingMode) {
        ann["accepted"] = ann.iou > iouThreshold;
    }
}
function toggleAnswer() {
    var ann = coco.dataset.annotations[current_num];
    if (ann) {
        ann["accepted"] = !(ann["accepted"]);
        loadYNTool(coco, current_num, panels=2, showGt=trainingMode);
    }
}

//
// Timer
//
var timer = new Date();
function startTimer(coco, current_num) {
    var ann = coco.dataset.annotations[current_num];
    timer = new Date();
    if ( ! ann.cumulativeTime) {
        ann.cumulativeTime = 0;
    }
}
function endTimer(coco, current_num) {
    var ann = coco.dataset.annotations[current_num];
    ann.cumulativeTime += (new Date() - timer) / 1000;
}
function toggleInstruction() {
    $("#instructionDiv").toggle();
    $("#yesnoDiv").toggle();
    if (trainingMode) {
        $("#trainingDiv").toggle();
    }
}


//
// Event Handlers
//
var keyIsDown = false;
var timerHandle;
$(window).keydown(function(e) {
    var key = e.which | e.keyCode;

    if (key == 39 && ! keyIsDown) { // Right
        nextImage();

        keyIsDown = true;
        clearInterval(timerHandle);
        timerHandle = setInterval(nextImage, 400);
    }
    else if (key == 37 && ! keyIsDown) { // Left
        prevImage();

        keyIsDown = true;
        clearInterval(timerHandle);
        timerHandle = setInterval(prevImage, 400);         
    }
});

$(window).keyup(function(e) {
    var key = e.which | e.keyCode;

    if (key == 37 || key == 39) { // Left or right
        keyIsDown = false;
        clearInterval(timerHandle);
    }
    else if (key == 32) { // Space
        toggleAnswer();
        e.preventDefault();
    }
});
