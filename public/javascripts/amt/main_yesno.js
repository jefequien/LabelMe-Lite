
var params = parseURLParams();
if (Object.keys(params).length == 0) {
    // No bundle_id
    redirectToAmtBrowser();
}

var coco = new COCO();
var current_num = 0;
var trainingMode = params.training_mode == "true";

window.onload = function() {

    getBundle(params, function(response) {
        console.log("Bundle:", response);
        coco = new COCO(response);

        startCurrentTask();
        loadInterface();
    });
}
function loadInterface() {
    loadInstructions(coco, current_num, trainingMode);
    loadMainHolders(coco, current_num, showGt=trainingMode);

}
function nextImage() {
    if (current_num < coco.dataset.annotations.length - 1) {
        endCurrentTask();
        current_num += 1;
        startCurrentTask();
        loadInterface();
    }
}
function prevImage() {
    if (current_num > 0) {
        endCurrentTask();
        current_num -= 1;
        startCurrentTask();
        loadInterface();
    }
}
function startCurrentTask() {
    startTimer();
    var ann = coco.dataset.annotations[current_num];
    if ( ! ann.current_task) {
        ann.current_task = {};
        ann.current_task["type"] = "yesno";
        ann.current_task["annotationTime"] = 0;
        ann.current_task["accepted"] = false;
    }
}
function endCurrentTask() {
    endTimer();
}
function toggleCurrentAnswer() {
    var ann = coco.dataset.annotations[current_num];
    ann.current_task["accepted"] = ! (ann.current_task["accepted"]);
    loadMainHolders(coco, current_num, showGt=trainingMode);
}
function submit() {
    endCurrentTask();
    var success = submitYesNoBundle(coco);
    if (success) {
        redirectToAmtBrowser();
    } else {
        startCurrentTask();
    }
}
function toggleInstruction() {
    $("#instructionDiv").toggle();
    $("#yesnoDiv").toggle();
    if (trainingMode) {
        $("#trainingDiv").toggle();
    }
}

//
// Timer
//
var timer;
function startTimer() {
    timer = new Date();
}
function endTimer() {
    var ann = coco.dataset.annotations[current_num];
    ann.current_task["annotationTime"] += (new Date() - timer) / 1000;
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
        toggleCurrentAnswer();
        e.preventDefault();
    }
});
