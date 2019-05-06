

var urlParams = parseURLParams();
if (Object.keys(urlParams).length == 0) {
    // Default params
    urlParams.dataset = "demo";
    urlParams.ann_source = "demo_anns";
    urlParams.img_id = 1;
    setURLParams(urlParams);
}

window.onload = function() {
    selectTool.switch();
    getAnnotations(urlParams, function(res) {
        var coco = new COCO(res);
        loadInterface(coco);
    });
}

function loadInterface(coco) {
    loadTool(coco);

    $('#datasetName').text(urlParams.dataset);
    $('#annotationSource').text(urlParams.ann_source);
    $('#imageFileName').text(coco.dataset.images[0].file_name);
}

function nextImage() {
    urlParams.img_id = parseInt(urlParams.img_id) + 1;
    setURLParams(urlParams);
    getAnnotations(urlParams, function(res) {
        var coco = new COCO(res);
        loadTool(coco);
    });
}
function prevImage() {
    urlParams.img_id = parseInt(urlParams.img_id) - 1;
    urlParams.img_id = Math.max(urlParams.img_id, 1);
    setURLParams(urlParams);
    getAnnotations(urlParams, function(res) {
        var coco = new COCO(res);
        loadTool(coco);
    });
}

//
// Event Handlers
//
var prevButton = document.getElementById('prevImage');
prevButton.onclick = prevImage;
var nextButton = document.getElementById('nextImage');
nextButton.onclick = nextImage;
