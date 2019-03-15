

var params = parseURLParams();
if (Object.keys(params).length == 0) {
    // Default params
    params.dataset = "demo";
    params.ann_source = "demo_anns";
    setURLParams(params);
}

window.onload = function() {
    selectTool.switch();
    getAnnotations(params, function(res) {
        var coco = new COCO(res);
        loadInterface(coco);
    });
}

function loadInterface(coco) {
    loadTool(coco, params);

    // Update params
    setURLParams(params);
    $('#datasetName').text(params.dataset);
    $('#annotationSource').text(params.ann_source);
    $('#imageFileName').text(params.file_name);
}

function nextImage() {
    params.img_id = parseInt(params.img_id) + 1;
    params.file_name = "";
    setURLParams(params);
    getAnnotations(params, function(res) {
        var coco = new COCO(res);
        loadTool(coco);
    });
}
function prevImage() {
    params.img_id = parseInt(params.img_id) - 1;
    params.img_id = Math.max(params.img_id, 1);
    params.file_name = "";
    setURLParams(params);
    getAnnotations(params, function(res) {
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
