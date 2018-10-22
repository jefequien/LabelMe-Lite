


function main() {
    selectTool.switch();

    var image_url = getImageURL();
    background.setImage(image_url);
    scissors.setImage(image_url);

    getAnnotations(function(res) {
        loadAnnotations(res.annotations);
    });
}

window.onload = function() {
    main();
}