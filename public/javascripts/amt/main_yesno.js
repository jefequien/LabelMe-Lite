
var params = parseURLParams();
if (Object.keys(params).length == 0) {
    // Default params
    params.bundle_id = "0202ba55407e420fa40964c2812edfbb";
    setURLParams(params);
}

var coco = new COCO();
var current_num = 0;

window.onload = function() {
    getBundle(params, function(res) {
        console.log("Bundle:", res);
        coco = new COCO(res);
        loadInterface(coco, current_num);
    });
}

function loadInterface(coco, current_num) {
    setDefaultAnswer(coco, current_num);
    loadYNTool(coco, current_num);
    loadInstructions(coco, current_num);
    updateSubmitButton(coco, current_num)
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
    var confirmed = confirm("Are you sure you want to submit?");
    if (confirmed) {
        postYesNoBundle(params, coco.dataset);
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

function setDefaultAnswer(coco, current_num) {
    var ann = coco.dataset.annotations[current_num];
    if (ann["accepted"] == null) {
        ann["accepted"] = false;
    }
}

function toggleAnswer() {
    var ann = coco.dataset.annotations[current_num];
    if (ann) {
        ann["accepted"] = !(ann["accepted"]);
        loadYNTool(coco, current_num);
    }
}

function updateSubmitButton(coco, current_num) {
    var anns = coco.dataset.annotations;
    var images_left = 0;
    for (var i = 0; i < anns.length; i++) {
        if (anns[i]["accepted"] == null) {
            images_left += 1;
        }
    }

    $("#submitButton").attr('value', "Submit (" + images_left + " images left)"); 
    $("#submitButton").prop('disabled', true); 

    if (images_left == 0) {
        $("#submitButton").attr('value', "Submit"); 
        $("#submitButton").prop('disabled', false); 
    }
}
function toggleInstruction() {
    $("#instructionDiv").toggle();
    $("#yesnoDiv").toggle();
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
