

var bundle;
var answers = [];
var current_num = -1;

window.onload = function() {
    getBundle(function(res) {
        bundle = res;
        next();
    });
}

function next() {
    if (current_num < bundle.length - 1) {
        current_num += 1;
        var task = bundle[current_num];
        var annotation = task["annotations"][0];

        $('#categoryDiv span').text(annotation["category"]);
        updateSubmitButton();

        clearTool();
        setUpTool(task);
    }
}

function updateSubmitButton() {
    var images_left = bundle.length - current_num - 1;
    $("#submitButton").attr('value', "Submit (" + images_left + " images left)"); 
    $("#submitButton").prop('disabled', true); 

    if (images_left == 0) {
        $("#submitButton").attr('value', "Submit"); 
        $("#submitButton").prop('disabled', false); 
        $("#nextButton").prop('disabled', true); 
    }
}

function confirmSubmit() {
    alert("Congrats of finishing.");
}

function toggleClarification() {
    $("#clarificationDiv").toggle()
}
