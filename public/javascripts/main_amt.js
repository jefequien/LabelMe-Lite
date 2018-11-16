
var bundle = [];
var answers = [];
var current_num = 0;

window.onload = function() {
    annotations.styleInverted = true;
    selectTool.switch();
    if (Object.keys(params).length == 0) {
        params.id = "ade20k_val_maskrcnnc_15";
        setWindowUrl(params);
    }

    getBundle(function(res) {
        if (res) {
            bundle = res;
            loadTool(bundle[0]);
            selectTool.switch();
        }
    });
}

function loadTool(task) {
    console.log(task);
    var category = task.annotations[0].category.split(" ")[0];
    $('#category').text(category);
    $('#current').text(current_num + 1);
    $('#total').text(bundle.length);

    background.setImage(task.image_url, function() {
        background.focus(window.annotations[0]);
    });
    scissors.setImage(task.image_url);
    brush.setImage(task.image_url);

    var annotations = [];
    if (task.annotations) {
        anns = task.annotations;
    }
    loadAnnotations(anns);
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
    window.history.pushState(null, null, "/amt?" + buildQuery(state));
}
