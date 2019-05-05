

function loadTool(coco) {
    var img = coco.dataset.images[0];

    // Load everything
    clearBackground(img);
    clearAnnotations();
    loadBackground(img);
    loadAnnotations(coco);

    selectTool.switch();
    background.focus();
}


function loadAMTTool(coco, ann_num) {
    var ann = coco.dataset.annotations[ann_num];
    if ( ! ann) {
        return;
    }
    var img = coco.imgs[ann["image_id"]];
    var data = {"images": [img], "annotations": [ann], "categories": coco.dataset.categories};
    var coco_ = new COCO(data);

    // Load everything
    clearBackground(img);
    clearAnnotations();
    loadBackground(img);
    loadAnnotations(coco_);

    annotations.styleInverted = true;
    background.setViewParameters(1);
    background.focus(annotations[0]);
    selectTool.switch();
    editTool.switch();
}

//
// Exports
//
window.loadTool = loadTool;
window.loadAMTTool = loadAMTTool;
