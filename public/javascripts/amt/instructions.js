

var keyword = "";

function loadInstructions(coco, current_num) {
    var ann = coco.dataset.annotations[current_num];
    var img = coco.imgs[ann["image_id"]];
    var cat = coco.cats[ann["category_id"]];

    $('#category').text(cat["name"]);
    $('#imageCount').text(coco.dataset.annotations.length);
    updateSubmitButton(coco);

    // Update instructions
    if (keyword != cat["name"]) {
        keyword = cat["name"];

        getDefinition(keyword, function(res) {
            updateCategory(res);
        });
    }
}

function updateCategory(entry) {
    if (entry == null) {
        $('#definition').text("None");
        return;
    }

    // Update definition
    $('#definition').text(entry.definition);

    // Update examples
    var query = {"dataset": "ade20k", "ann_source": "iou_examples", "cat_id": entry.ade_ids};
    getAnnotations(query, function(res) {
        var coco_examples = new COCO(res);
        var anns = coco_examples.dataset.annotations;

        var yesCounter = 0;
        var noCounter = 0;
        for (var i = 0; i < anns.length; i++) {
            var ann = anns[i];
            if (ann.iou > 0.9 && yesCounter < 3) {
                var holderDiv = "#exampleYes" + yesCounter.toString();
                var img = coco_examples.imgs[ann["image_id"]];
                loadImageIntoHolderDiv(img, ann, holderDiv);
                yesCounter += 1;
            }
            if (ann.iou < 0.6 && noCounter < 3) {
                var holderDiv = "#exampleNo" + noCounter.toString();
                var img = coco_examples.imgs[ann["image_id"]];
                loadImageIntoHolderDiv(img, ann, holderDiv);
                noCounter += 1;
            }
        }
    });
}

function updateSubmitButton(coco) {
    var anns = coco.dataset.annotations;
    var images_left = 0;
    for (var i = 0; i < anns.length; i++) {
        if (anns[i]["answer"] == null) {
            images_left += 1;
        }
    }

    $("#submitButton").attr('value', "Submit (" + images_left + " images left)"); 
    $("#submitButton").prop('disabled', true); 

    if (images_left == 0) {
        $("#submitButton").attr('value', "Submit"); 
        $("#submitButton").prop('disabled', false); 
    }
}
