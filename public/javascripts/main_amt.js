
var params = parseURLParams();
if (Object.keys(params).length == 0) {
    // Default params
    params.id = "0037ff2455074da18282bab1c96410ed";
    setURLParams(params);
}

var coco = new COCO();
var current_num = 0;

window.onload = function() {
    annotations.styleInverted = true;
    selectTool.switch();

    getBundle(params, function(res) {
        coco = new COCO(res);
        loadTool(coco, current_num);
    });
}

function loadTool(coco, num) {
    clearBackground();
    clearAnnotations();
    selectTool.switch();
    if ( ! coco.dataset) {
        return;
    }

    var imgs = coco.dataset.images;
    var anns = coco.dataset.annotations;
    var cats = coco.dataset.categories;

    var ann = anns[num];
    var img = coco.imgs[ann["image_id"]];
    var cat = coco.cats[ann["category_id"]];

    ann["category_name"] = cat["name"];
    var img_params = {"dataset": "places", "file_name": img.file_name}
    var image_url = getImageURL(img_params);
    loadBackground(image_url);
    loadAnnotations([ann]);

    background.focus(annotations[0]);
    editTool.switch();


    // Update params
    $('#category').text(cat["name"]);
    $('#current').text(current_num + 1);
    $('#total').text(coco.dataset.annotations.length);
}

function nextImage() {
    var anns = saveAnnotations();
    coco.dataset.annotations[current_num]["segmentation"] = anns[0]["segmentation"];

    if (current_num < coco.dataset.annotations.length - 1) {
        current_num += 1;
        loadTool(coco, current_num);
    }
}

function prevImage() {
    var anns = saveAnnotations();
    coco.dataset.annotations[current_num]["segmentation"] = anns[0]["segmentation"];

    if (current_num > 0) {
        current_num -= 1;
        loadTool(coco, current_num);
    }
}

//
// Event Handlers
//
var prevButton = document.getElementById('prevImage');
prevButton.onclick = prevImage;
var nextButton = document.getElementById('nextImage');
nextButton.onclick = nextImage;

document.addEventListener('keydown', function(event) {
    if (event.keyCode == 39) { // Right
        nextImage();
    }
    if (event.keyCode == 37) { // Left
        prevImage();
    }
});
