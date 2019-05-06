

function loadInstructions(coco, current_num, trainingMode) {
    updateInstructions(coco, current_num, trainingMode);
    updateSubmitButton(coco, current_num, trainingMode);
    updateCategory(coco, current_num);
}

var lastCategory = "";
function updateCategory(coco, current_num) {
    var ann = coco.dataset.annotations[current_num];
    if ( ! ann) {
        lastCategory = "";
        $('#categoryName0').text("category");
        $('#categoryName1').text("category");
        $('#definition').text("None");
        return;
    }

    var cat = coco.cats[ann["category_id"]];
    if (lastCategory != cat["name"]) {
        lastCategory = cat["name"];
        $('#categoryName0').text(cat["name"]);
        $('#categoryName1').text(cat["name"]);

        // Load definition
        $('#definition').text("Loading...");
        getDefinition(cat, function(res) {
            $('#definition').text((res) ? res.definition : "None");
        });
        // Load examples
        getHiddenTests([cat], function(hidden_tests) {
            console.log("Examples", hidden_tests);
            loadExampleHolders(hidden_tests);
        });
    }
}

function updateInstructions(coco, current_num, trainingMode) {
    $('#bundleLength').text(coco.dataset.annotations.length);
    
    if (trainingMode) {
        $("#trainingDiv").show();
    } else {
        $("#trainingDiv").hide();
    }
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
