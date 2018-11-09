
var bundle = [];
var answers = [];
var current_num = 0;

window.onload = function() {
    selectTool.switch();
    main();
}

function main() {
    getBundle(function(res) {
        bundle = res;
        current_num = 0;
        loadTool(bundle[0]);
        selectTool.switch();
    });
}

function loadTool(task) {
    console.log(task);
    $('#datasetName span').text(task.dataset);
    $('#annotationSource span').text(current_num);
    $('#imageFileName span').text(task.file_name);
    background.setImage(task.image_url);
    scissors.setImage(task.image_url);
    brush.setImage(task.image_url);
    
    var annotations = [];
    if (task.annotations) {
        annotations = task.annotations;
    }
    loadAnnotations(annotations);
}

var prevButton = document.getElementById('prevImage');
prevButton.onclick = function() {
    if (current_num > 0) {
        current_num -= 1;
        clearAnnotations();
        loadTool(bundle[current_num]);
        selectTool.switch();
    }
}
var nextButton = document.getElementById('nextImage');
nextButton.onclick = function() {
    if (current_num < bundle.length - 1) {
        current_num += 1;
        clearAnnotations();
        loadTool(bundle[current_num]);
        selectTool.switch();
    }
}
