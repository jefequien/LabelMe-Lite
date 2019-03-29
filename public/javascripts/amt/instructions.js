

var keyword = "";
var numExamples = 3;

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

    // Update instructions
    if (keyword != cat["name"]) {
        keyword = cat["name"];
        getDefinition(keyword, function(res) {
            console.log("Definitions: ", res);
            if (res) {
                entry = res[0];
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
        loadExamples(coco_examples);
    });
}

function loadExamples(coco) {
    var yesExamples = [];
    var noExamples = [];
    for (var i = 0; i < coco.dataset.annotations.length; i++) {
        var ann = coco.dataset.annotations[i];
        if (ann.hidden_test) {
            if (ann.hidden_test.iou > 0.8) {
                yesExamples.push(ann);
            }
            else if (ann.hidden_test.iou < 0.7) {
                noExamples.push(ann);
            }
        }
    }

    for (var i = 0; i < numExamples; i++) {
        var holderDiv = "#exampleYes" + i.toString();
        clearHolderDiv(holderDiv);
        $(holderDiv + " b").html("IoU=None");
        if (i < yesExamples.length) {
            var ann = yesExamples[i];
            var img = coco.imgs[ann["image_id"]];
            drawHolderDiv(holderDiv, img, ann, panels=2, showGt=true);
        }

        var holderDiv = "#exampleNo" + i.toString();
        clearHolderDiv(holderDiv);
        $(holderDiv + " b").html("IoU=None");
        if (i < noExamples.length) {
            var ann = noExamples[i];
            var img = coco.imgs[ann["image_id"]];
            drawHolderDiv(holderDiv, img, ann, panels=2, showGt=true);
        }
    }
}
