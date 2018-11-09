


function loadTool() {
    selectTool.switch();
    getAnnotations(function(res) {
        $('#datasetName span').text(res.dataset);
        $('#annotationSource span').text(res.ann_source);
        $('#imageFileName span').text(res.file_name);
        background.setImage(res.image_url);
        scissors.setImage(res.image_url);
        brush.setImage(res.image_url);
        
        var annotations = [];
        if (res.annotations) {
            annotations = res.annotations;
        }
        loadAnnotations(annotations);

        setWindowUrl(res);
    });
}

function setWindowUrl(json) {
    var state = {dataset: json.dataset,
                ann_source: json.ann_source, 
                file_name: json.file_name}
    window.history.pushState(null, null, "/game?" + buildQuery(state));
}

var prevButton = document.getElementById('prevImage');
prevButton.onclick = function() {
    clearAnnotations();
    getPrevImage(function(json){
        setWindowUrl(json);
        loadTool();
    });
}
var nextButton = document.getElementById('nextImage');
nextButton.onclick = function() {
    clearAnnotations();
    getNextImage(function(json){
        setWindowUrl(json);
        loadTool();
    });
}

window.onload = function() {
    loadTool();
}