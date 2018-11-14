
window.onload = function() {
    selectTool.switch();
    if (Object.keys(params).length == 0) {
        params.dataset = "ade20k_val";
        params.ann_source = "pspnet";
        setWindowUrl(params);
    }
    
    getAnnotations(function(res) {
        loadTool(res);
    });
}


function loadTool(task) {
    console.log(task);

    $('#datasetName').text(task.dataset);
    $('#annotationSource').text(task.ann_source);
    $('#imageFileName').text(task.file_name);
    background.setImage(task.image_url);
    scissors.setImage(task.image_url);
    brush.setImage(task.image_url);
    
    if (task.annotations) {
        loadAnnotations(task.annotations);
    } else {
        loadAnnotations([]);
    }

    setWindowUrl(task);
}

var prevButton = document.getElementById('prevImage');
prevButton.onclick = function() {
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
    window.history.pushState(null, null, "/game?" + buildQuery(state));
}