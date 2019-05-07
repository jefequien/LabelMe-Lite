
var urlParams = parseURLParams();
console.log("URL Params", urlParams);

var coco = new COCO();
var current_num = 0;
var num_tests = 0;

window.onload = function() {
    getBundle(urlParams, function(response) {
        coco = new COCO(response);
        console.log("Bundle", coco.dataset);
        addHiddenTests(coco, num_tests, function() {
            console.log("COCO", coco.dataset);
            startTask();
            loadInterface();
        });
    });
    selectTool.switch();
}
function loadInterface() {
    updateInstructions(coco, current_num);
    loadMainHolders(coco, current_num);
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
    console.log("Submitting results...");
    endTask();
    var results = evaluateBundle(coco);
    if (results.passed) {
        var coco_results = removeHiddenTests(coco);
        postResults(urlParams, coco_results);
        showResults(results);
    }
    startTask();
}

function toggleInstruction() {
    $("#instructionDiv").toggle();
    $("#yesnoDiv").toggle();
    $("#toolDiv").toggle();
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
