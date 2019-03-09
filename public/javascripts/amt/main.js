
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
        loadTool(coco, current_num);
        loadYNTool(coco, current_num, true, true);
    });
}

function loadTool(coco, current_num) {
    clearBackground();
    clearAnnotations();
    selectTool.switch();
    if ( ! coco.dataset) {
        return;
    }

    var ann = coco.dataset.annotations[current_num];
    var img = coco.imgs[ann["image_id"]];
    var cat = coco.cats[ann["category_id"]];

    // Load annotations
    var data = {"images": [img], "annotations": [ann], "categories": coco.dataset.categories};
    var coco_ = new COCO(data);
    loadAnnotations(coco_);

    // Load image
    var img_params = {"dataset": "places", "file_name": img.file_name}
    var image_url = getImageURL(img_params);
    loadBackground(image_url);

    annotations.styleInverted = true;
    background.focus(annotations[0]);
    editTool.switch();

    // Update params
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
        loadTool(coco, current_num);
        loadYNTool(coco, current_num, true, true);
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
        loadTool(coco, current_num);
        loadYNTool(coco, current_num, true, true);
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
