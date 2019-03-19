

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
    var image_url = getImageURL(img);
    loadBackground(image_url);
    
    // Interface
    $('#category').text(cat["name"]);
    $('#current').text(current_num + 1);
    $('#total').text(coco.dataset.annotations.length);

    annotations.styleInverted = true;
    background.focus(annotations[0]);
    editTool.switch();
}