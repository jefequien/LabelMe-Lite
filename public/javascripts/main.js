


function main() {
    selectTool.switch();

    var image_url = getImageURL();
    background.setImage(image_url);
    scissors.setImage(image_url);

    getAnnotations(function(res) {
        loadAnnotations(res.annotations);   
    });
}

function main_old() {
    selectTool.switch();
    getAnnotations(function(res) {

        var image_url = res.image_url;
        background.setImage(image_url);
        var temp = "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Squash_court.JPG/275px-Squash_court.JPG";
        scissors.setImage(temp);

        loadAnnotations(res.annotations);
    });
}

window.onload = function() {
    main();
}