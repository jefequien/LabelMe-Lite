

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
        loadTool(coco);
    });
}

function loadTool(coco) {
    clearBackground();
    clearAnnotations();
    selectTool.switch();
    if ( ! coco.dataset) {
        return;
    }

    var imgs = coco.dataset.images;
    var anns = coco.dataset.annotations;
    var cats = coco.dataset.categories;

    var img = imgs[0];
    for (var i = 0; i < anns.length; i++) {
        var catId = anns[i]["category_id"];
        var cat = coco.cats[catId];
        anns[i]["category_name"] = cat["name"];
    }

    var image_url = getImageURL(params);
    loadBackground(image_url, function() {
        background.focus();
    });
    loadAnnotations(anns);


    // Update params
    $('#datasetName').text(params.dataset);
    $('#annotationSource').text(params.ann_source);
    $('#imageFileName').text(params.file_name);
    params.file_name = img.file_name || "";
    params.img_id = img.id;
    setURLParams(params);
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
