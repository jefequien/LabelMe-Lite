
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
    selectTool.switch();

    getBundle(params, function(res) {
        console.log("Bundle:", res);
        coco = new COCO(res);
        loadInterface(coco, current_num);
    });
}

function loadInterface(coco, current_num) {
    loadInstructions(coco, current_num, trainingMode);
    updateSubmitButton(coco, current_num);

    loadYNTool(coco, current_num, panels=2, showGt=trainingMode);
    loadEditTool(coco, current_num);
    startTimer(coco, current_num);
}

function nextImage() {
    if (current_num < coco.dataset.annotations.length - 1) {
        saveCurrentAnnotation(coco, current_num);
        endTimer(coco, current_num);
        current_num += 1;
        loadInterface(coco, current_num);
    }
}
function prevImage() {
    if (current_num > 0) {
        saveCurrentAnnotation(coco, current_num);
        endTimer(coco, current_num);
        current_num -= 1;
        loadInterface(coco, current_num);
    }
}
function submitResults() {
    endTimer(coco, current_num);

    var results = evaluateEditBundle(coco, iouThreshold);
    var passed = results.averageIOU >= passingThreshold;

    if (passed) {
        postEditBundle(params, coco);
        var alertString = "Thank you for your submission! ";
        alertString += "You scored an average IOU of " + results.averageIOU.toFixed(3) + " on " + results.numTests + " hidden tests. ";
        alertString += "\n\nYou spent on average " + results.averageTime.toFixed(3) + " seconds per annotation. ";
        alert(alertString);

        redirectToEditBrowser();

    } else {
        var alertString = "You failed! ";
        alertString += "You must score an average IOU of " + passingThreshold + " on the hidden tests in order to submit. ";
        alertString += "You scored an average IOU of " + results.averageIOU + " on " + results.numTests  + " hidden tests. ";
        alertString += "\n\nPlease go back and improve your annotations. We recommend the start from the beginning. For more information, click Instructions. ";
        alertString += "\n\nYou spent on average " + results.averageTime.toFixed(3) + " seconds per annotation. ";
        alert(alertString);
    }

    startTimer(coco, current_num);
}
function updateSubmitButton(coco, current_num) {
    var anns = coco.dataset.annotations;
    var images_left = anns.length - current_num - 1;

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

function saveCurrentAnnotation(coco, current_num) {
    var coco_ = saveAnnotations();
    var ann_ = coco_.dataset.annotations[0];

    var ann = coco.dataset.annotations[current_num];
    ann["segmentation"] = ann_["segmentation"];
    ann["bbox"] = ann_["bbox"];
    if (ann.hidden_test) {
        ann.hidden_test.iou = computeIOU(ann["segmentation"], ann.hidden_test["segmentation"]);
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
    $("#toolDiv").toggle();
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
});
