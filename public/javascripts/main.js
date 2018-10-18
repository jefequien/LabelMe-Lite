


function main(task) {
    var img_url = task["image_url"];
    var annotations = task["annotations"];
    var img_url = "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Squash_court.JPG/275px-Squash_court.JPG";

    var img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = img_url;
    img.onload = function() {
      background.setImage(this);
      scissors.setImageData(background.image.getImageData());
    }

    loadAnnotations(annotations);
    selectTool.switch();
}

window.onload = function() {
    getData(main);
}