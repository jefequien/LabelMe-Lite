
function main(task) {
    var image_url = task["image_url"];
    var annotations = task["annotations"];
    annotator.loadImage(image_url);
    annotator.loadAnnotations(annotations);
    annotator.selectTool.switch();
}

window.onload = function() {
    getData(main);
}