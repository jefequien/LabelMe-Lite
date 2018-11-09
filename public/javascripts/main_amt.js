
var bundle = [];
var answers = [];
var current_num = 0;

window.onload = function() {
    selectTool.switch();
    if (Object.keys(params).length == 0) {
        params.id = "ade20k_val_maskrcnnc_15";
        setWindowUrl(params);
    }

    getBundle(function(res) {
        bundle = res;
        current_num = 0;
        loadTool(bundle[0]);
        selectTool.switch();
    });
}

function main() {
}

function loadTool(task) {
    console.log(task);
    var category = task.annotations[0].category.split(" ")[0];

    $('#category span').text(category);
    $('#current').text(current_num + 1);
    $('#total').text(bundle.length);

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

function setWindowUrl(json) {
    var state = {id: json.id}
    window.history.pushState(null, null, "/game_amt?" + buildQuery(state));
}
