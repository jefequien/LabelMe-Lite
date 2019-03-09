
var params = parseURLParams();
if (Object.keys(params).length == 0) {
    // Default params
    params.bundle_id = "033367d2221f4f9f961995e18c979282";
    setURLParams(params);
}

var coco = new COCO();
var current_num = 0;

window.onload = function() {
    getBundle(params, function(res) {
        coco = new COCO(res);
        loadYNTool(coco, current_num);
        updateSubmitButton();
    });
}

function nextImage() {
    var anns = coco.dataset.annotations;
    if (current_num < anns.length - 1) {
        current_num += 1;
        loadYNTool(coco, current_num);
        updateSubmitButton();
    }
}
function prevImage() {
    if (current_num > 0) {
        current_num -= 1;
        loadYNTool(coco, current_num);
        updateSubmitButton();
    }
}

function updateSubmitButton() {
    var anns = coco.dataset.annotations;
    var images_left = 0;
    for (var i = 0; i < anns.length; i++) {
        if (anns[i]["answer"] == null) {
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

function toggleAnswer() {
    var anns = coco.dataset.annotations;
    var ann = anns[current_num];
    ann["answer"] = !(ann["answer"]);
    loadYNTool(coco, current_num);
}

function confirmSubmit() {
    confirm(coco.dataset.annotations);
}
function toggleClarification() {
    $("#clarificationDiv").toggle()
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
