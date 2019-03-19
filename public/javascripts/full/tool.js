

function loadTool(coco) {
    clearBackground();
    clearAnnotations();
    selectTool.switch();
    if ( ! coco.dataset) {
        return;
    }
    
    var img = coco.dataset.images[0];
    
    var image_url = getImageURL(img);
    loadBackground(image_url, function() {
        background.focus();
    });
    loadAnnotations(coco);
}