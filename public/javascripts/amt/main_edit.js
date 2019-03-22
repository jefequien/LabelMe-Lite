
var params = parseURLParams();
if (Object.keys(params).length == 0) {
    // Default params
    params.bundle_id = "0202ba55407e420fa40964c2812edfbb";
    setURLParams(params);
}

var coco = new COCO();
var current_num = 0;

window.onload = function() {
    selectTool.switch();
    getBundle(params, function(res) {
        coco = new COCO(res);
        loadInterface(coco, current_num);
    });
}

function loadInterface(coco, current_num) {
    loadYNTool(coco, current_num, true);
    loadTool(coco, current_num);
    updateSubmitButton(coco, current_num);
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
    var confirmed = confirm("Are you sure you want to submit?");
    if (confirmed) {
        postEditBundle(params, coco.dataset);
    }
}
function updateSubmitButton(coco, current_num) {
    var anns = coco.dataset.annotations;
    var images_left = anns.length - current_num - 1;
    var cat = coco.cats[anns[current_num]["category_id"]];

    $("#submitButton").attr('value', cat["name"] + " (" + images_left + " images left)"); 
    $("#submitButton").prop('disabled', true); 
    if (images_left == 0) {
        $("#submitButton").attr('value', "Submit"); 
        $("#submitButton").prop('disabled', false); 
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

function saveCurrentAnnotation(coco, current_num) {
    var ann = coco.dataset.annotations[current_num];

    var coco_ = saveAnnotations();
    var ann_ = coco_.dataset.annotations[0];
    ann["segmentation"] = ann_["segmentation"];
    ann["bbox"] = ann_["bbox"];
}

//
// Event Handlers
//
var prevButton = document.getElementById('prevImage');
prevButton.onclick = prevImage;
var nextButton = document.getElementById('nextImage');
nextButton.onclick = nextImage;

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