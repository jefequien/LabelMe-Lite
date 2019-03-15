
var params = parseURLParams();
if (Object.keys(params).length == 0) {
    // Default params
    params.bundle_id = "033367d2221f4f9f961995e18c979282";
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
    loadYNTool(coco, current_num, true, true);
    loadTool(coco, current_num);

    // Interface
    $('#category').text(cat["name"]);
    $('#current').text(current_num + 1);
    $('#total').text(coco.dataset.annotations.length);
}

function nextImage() {
    var coco_ = saveAnnotations();
    var ann_ = coco_.dataset.annotations[0];
    var ann = coco.dataset.annotations[current_num];
    ann["segmentation"] = ann_["segmentation"];
    ann["bbox"] = ann_["bbox"];

    if (current_num < coco.dataset.annotations.length - 1) {
        current_num += 1;
        loadInterface(coco, current_num);
    }
}

function prevImage() {
    var coco_ = saveAnnotations();
    var ann_ = coco_.dataset.annotations[0];
    var ann = coco.dataset.annotations[current_num];
    ann["segmentation"] = ann_["segmentation"];
    ann["bbox"] = ann_["bbox"];

    if (current_num > 0) {
        current_num -= 1;
        loadInterface(coco, current_num);
    }
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
