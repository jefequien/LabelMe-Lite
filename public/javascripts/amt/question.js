

function loadQuestion(coco, current_num) {
    console.log("loading question");
    console.log(coco);

    var ann = coco.dataset.annotations[current_num];
    var img = coco.imgs[ann["image_id"]];
    var cat = coco.cats[ann["category_id"]];

    // Load cat
    $('#category').text(cat["name"]);
    $('#definition').text("loading definition");
}

