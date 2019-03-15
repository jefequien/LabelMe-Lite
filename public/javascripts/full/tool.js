

function loadTool(coco, params) {
    clearBackground();
    clearAnnotations();
    selectTool.switch();
    if ( ! coco.dataset) {
        return;
    }
    
    var img = coco.dataset.images[0];

    var image_url = getImageURL(params.dataset, img);
    loadBackground(image_url, function() {
        background.focus();
    });
    loadAnnotations(coco);

    // Update url params
    params.file_name = img.file_name || "";
    params.img_id = img.id;
}