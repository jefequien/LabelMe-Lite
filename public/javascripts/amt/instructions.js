

var lastCategory = "";
function updateInstructions(coco, current_num) {
    $('#bundleLength').text(coco.dataset.annotations.length);
    updateSubmitButton(coco, current_num);

    var ann = coco.dataset.annotations[current_num];
    var cat = (ann) ? coco.cats[ann["category_id"]] : null;
    var category = (cat) ? cat["name"] : "";
    if (category != lastCategory) {
        updateCategory(cat);
        updateDefinition(cat);
        updateExamples(cat);
        lastCategory = category;
    }
}

function updateCategory(cat) {
    if ( ! cat) {
        $('#categoryName0').text("category");
        $('#categoryName1').text("category");
        return;
    }
    $('#categoryName0').text(cat["name"]);
    $('#categoryName1').text(cat["name"]);
}

function updateExamples(cat) {
    if ( ! cat) {
        return;
    }
    getHiddenTests([cat], function(examples) {
        loadExamples(examples);
    });
}

function updateDefinition(cat) {
    if ( ! cat) {
        $('#definition').text("None");
        return;
    }
    $('#definition').text("Loading...");
    getDefinition(cat, function(res) {
        $('#definition').text((res) ? res.definition : "None");
    });
}

function updateSubmitButton(coco, current_num) {
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
}
