

var keyword = "";

function loadInstructions(coco, current_num, trainingMode) {
    var ann = coco.dataset.annotations[current_num];
    var img = coco.imgs[ann["image_id"]];
    var cat = coco.cats[ann["category_id"]];

    $('#category').text(cat["name"]);
    $('#imageCount').text(coco.dataset.annotations.length);
    if (trainingMode) {
        $("#trainingDiv").show();
    } else {
        $("#trainingDiv").hide();
    }
    updateSubmitButton(coco, current_num, trainingMode)

    // Update instructions
    if (keyword != cat["name"]) {
        keyword = cat["name"];
        getDefinition(keyword, function(response) {
            console.log("Definitions: ", response);
            if (response) {
                entry = response[0];
                updateCategory(entry);
            }
        });
    }
}

function updateCategory(entry) {
    if (entry == null) {
        $('#definition').text("None"); // No definition
        return;
    }

    // Load definition
    $('#definition').text(entry.definition);
    // Load examples
    var query = {"dataset": "ade20k", "ann_source": "full_val_test", "cat_id": entry.ade_ids};
    getAnnotations(query, function(res) {
        console.log("Examples: ", res);
        var coco_examples = new COCO(res);
        loadExampleHolders(coco_examples);
    });
}

function updateSubmitButton(coco, current_num, trainingMode) {
    var anns = coco.dataset.annotations;
    var images_left = 0;
    for (var i = 0; i < anns.length; i++) {
        if (anns[i].current_task == null) {
            images_left += 1;
        }
    }

    $("#submitButton").html("Submit (" + images_left + " images left)"); 
    $("#submitButton").prop('disabled', true); 
    if (images_left == 0) {
        $("#submitButton").html("Submit"); 
        $("#submitButton").prop('disabled', false); 
    }
    if (trainingMode) {
        $("#submitButton").html("Training Mode (" + images_left + " images left)");
        $("#submitButton").prop('disabled', true); 
    }
}
