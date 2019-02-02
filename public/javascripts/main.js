
window.onload = function() {
    // Default url
    if (Object.keys(params).length == 0) {
        params.dataset = "demo";
        params.ann_source = "demo_anns";
        setWindowUrl(params);
    }
    
    selectTool.switch();
    getAnnotations(function(response) {
        if (response) {
            loadTool(response);
        } else {
            console.log("Annotations not found.");
        }
    });
}


function loadTool(task) {
    console.log(task);
    setWindowUrl(task);
    $('#datasetName').text(task.dataset);
    $('#annotationSource').text(task.ann_source);
    $('#imageFileName').text(task.file_name);

    var image_url = task.image_url;
    var annotations = task.annotations;
    if (! image_url) {
        image_url = getImageURL();
    }
    if (! annotations) {
        annotations = [];
    }

    loadAnnotations(annotations);
    background.setImage(image_url, function() {
        background.focus();
    });
}

var prevButton = document.getElementById('prevImage');
prevButton.onclick = function() {
    background.clearImage();
    clearAnnotations();
    getPrevImage(function(json){
        setWindowUrl(json);
        getAnnotations(function(res) {
            loadTool(res);
            selectTool.switch();
        });
    });
}
var nextButton = document.getElementById('nextImage');
nextButton.onclick = function() {
    background.clearImage();
    clearAnnotations();
    getNextImage(function(json){
        setWindowUrl(json);
        getAnnotations(function(res) {
            loadTool(res);
            selectTool.switch();
        });
    });
}

function setWindowUrl(json) {
    var state = {dataset: json.dataset,
                ann_source: json.ann_source, 
                file_name: json.file_name}
    window.history.pushState(null, null, "/tool?" + buildQuery(state));
}