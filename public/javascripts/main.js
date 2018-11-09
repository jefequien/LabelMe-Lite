


function main() {

    getAnnotations(function(res) {
        load(res);
    });
    selectTool.switch();
}

function load(res) {
    $('#datasetName span').text(res.dataset);
    $('#imageFileName span').text(res.file_name);
    $('#annotationSource span').text(res.ann_source);

    if (res.annotations) {
        loadAnnotations(res.annotations);
    }

    var image_url = getImageURL();
    background.setImage(image_url);
    scissors.setImage(image_url);
    brush.setImage(image_url);
}

window.onload = function() {
    main();
}