
var urlParams = parseURLParams();
console.log(urlParams);
if ( ! urlParams.bundle_id) {
    redirectToAmtBrowser(urlParams);
}

var coco = new COCO();
var current_num = 0;
var num_tests = 0;
var trainingMode = urlParams.training_mode == "true";

window.onload = function() {
    getBundle(urlParams, function(response) {
        coco = new COCO(response);
        addHiddenTests(coco, num_tests, function() {
            console.log("COCO", coco.dataset);
            startTask();
            loadInterface();
        });
    });
    selectTool.switch();
}
function loadInterface() {
    loadInstructions(coco, current_num, trainingMode);
    loadMainHolders(coco, current_num, showGt=trainingMode);
    loadAMTTool(coco, current_num);
}
function nextImage() {
    if (current_num < coco.dataset.annotations.length - 1) {
        endTask();
        current_num += 1;
        startTask();
        loadInterface();
    }
}
function prevImage() {
    if (current_num > 0) {
        endTask();
        current_num -= 1;
        startTask();
        loadInterface();
    }
}
function startTask() {
    startTimer();
    var ann = coco.dataset.annotations[current_num];
    if (ann && ! ann.current_task) {
        ann.current_task = {};
        ann.current_task["type"] = "edit";
        ann.current_task["annotationTime"] = 0;
        ann.current_task["segmentation"] = ann["segmentation"];
    }
}
function endTask() {
    saveAnswer();
    endTimer();
}
function saveAnswer() {
    var coco_ = saveAnnotations();
    var ann_ = coco_.dataset.annotations[0];

    var ann = coco.dataset.annotations[current_num];
    ann["segmentation"] = ann_["segmentation"];
    ann["bbox"] = ann_["bbox"];
}
function submit() {
    endTask();
    submitBundle(coco);
    startTask();
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
// Timer
//
var timer = new Date();
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
});
