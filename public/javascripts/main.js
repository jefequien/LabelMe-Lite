


function main() {

    var image_url = getImageURL();
    background.setImage(image_url);
    scissors.setImage(image_url);
    brush.setImage(image_url);

    getAnnotations(function(res) {
        console.log("Received annotations");
        loadAnnotations(res.annotations);
    });
    selectTool.switch();
}

window.onload = function() {
    main();
}