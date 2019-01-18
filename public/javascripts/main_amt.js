
var bundle = [];
var answers = [];
var current_num = 0;

window.onload = function() {
    annotations.styleInverted = true;
    selectTool.switch();
    if (Object.keys(params).length == 0) {
        params.id = "examples/ade20k_val_maskrcnnc_15";
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

    var image_url = task.image_url;
    var anns = task.annotations;
    if (! anns) {
        anns = [];
    }

    background.setImage(image_url, function() {
        background.focus(annotations[0]);
    });
    // scissors.setImage(task.image_url_backup);
    // brush.setImage(task.image_url_backup);
    loadAnnotations(anns);
}

var prevButton = document.getElementById('prevImage');
prevButton.onclick = function() {
    if (current_num > 0) {
        bundle[current_num].annotations = saveAnnotations();
        background.clearImage();
        clearAnnotations();

        current_num -= 1;
        loadTool(bundle[current_num]);
        selectTool.switch();
    }
}
var nextButton = document.getElementById('nextImage');
nextButton.onclick = function() {
    if (current_num < bundle.length - 1) {
        bundle[current_num].annotations = saveAnnotations();
        background.clearImage();
        clearAnnotations();

        current_num += 1;
        loadTool(bundle[current_num]);
        selectTool.switch();
    }
}

document.addEventListener('keydown', function(event) {
    if (event.keyCode == 13) { // Enter
        nextButton.onclick();
    }
});

function setWindowUrl(json) {
    var state = {id: json.id}
    window.history.pushState(null, null, "/amt?" + buildQuery(state));
}
