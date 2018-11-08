


function main() {

    getAnnotations(function(res) {
        load(res);
    });
    selectTool.switch();
}

function load(res) {
    $('#datasetName span').text(res["dataset"]);
    $('#imageFileName span').text(res["file_name"]);
    $('#annotationSource span').text(res["ann_source"]);
    var image_url = getImageURL();

    loadAnnotations(res["annotations"]);
    background.setImage(image_url);
    scissors.setImage(image_url);
    brush.setImage(image_url);
}

window.onload = function() {
    main();
}