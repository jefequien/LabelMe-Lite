


function main() {
    selectTool.switch();

    getAnnotations(function(res) {
        loadTool(res);
    });
}

function loadTool(res) {
    console.log(res);
    $('#datasetName span').text(res.dataset);
    $('#imageFileName span').text(res.file_name);
    $('#annotationSource span').text(res.ann_source);

    if (res.annotations) {
        loadAnnotations(res.annotations);
    }

    var image_url = getImageURL();
    background.setImage(image_url);
    // scissors.setImage(image_url);
    // brush.setImage(image_url);
}

var prevButton = document.getElementById('prevImage');
prevButton.onclick = function() {
    getPrevImage(function(json){
        console.log(json);
        clearAnnotations();
        // window.location.href = url + "?" + buildQuery(json);
    });
}
var nextButton = document.getElementById('nextImage');
nextButton.onclick = function() {
    getNextImage(function(json){
        console.log(json);
        // window.location.href = url + "?" + buildQuery(json);
    });
}

window.onload = function() {
    main();
}