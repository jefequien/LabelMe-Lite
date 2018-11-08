


function main() {

    var image_url = getImageURL();
    background.setImage(image_url);
    scissors.setImage(image_url);
    brush.setImage(image_url);

    getAnnotations(function(res) {
        load(res);
    });
    selectTool.switch();
}

function load(res) {
    $('#datasetName span').text(res["proj_name"]);
    $('#imageFileName span').text(res["file_name"]);
    $('#annotationSource span').text(res["proj_name"]);
    loadAnnotations(res.annotations);
}

window.onload = function() {
    // $("#questionDiv").load("html/question.html"); 
    main();
}