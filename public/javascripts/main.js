
window.onload = function() {
    selectTool.switch();
    main();
}

function main() {
    getAnnotations(function(res) {
        loadTool(res);
    });
}


function loadTool(task) {
    console.log(task);
    
    $('#datasetName span').text(task.dataset);
    $('#annotationSource span').text(task.ann_source);
    $('#imageFileName span').text(task.file_name);
    background.setImage(task.image_url);
    scissors.setImage(task.image_url);
    brush.setImage(task.image_url);
    
    var annotations = [];
    if (task.annotations) {
        annotations = task.annotations;
    }
    loadAnnotations(annotations);

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