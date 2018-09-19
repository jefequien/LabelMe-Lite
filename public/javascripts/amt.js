
window.onload = function() {
    getBundle(setUp);
}

var current_num = 0;
var current_task = null;
var all_tasks = null;
var answers = [];

function setUp(bundle) {
    all_tasks = bundle;
    current_num = -1;
    next();
}

function next() {
    if (current_num < all_tasks.length) {
        current_num += 1;
        current_task = all_tasks[current_num];
        $('#categoryDiv span').text(current_task["category"]);
        updateSubmitButton();

        clearTool();
        setUpTool(current_task);
    }
}

function updateSubmitButton() {
    var images_left = all_tasks.length - current_num - 1;
    $("#submitButton").attr('value', "Submit (" + images_left + " images left)"); 
    $("#submitButton").prop('disabled', true); 

    if (images_left == 0) {
        $("#submitButton").attr('value', "Submit"); 
        $("#submitButton").prop('disabled', false); 
    }
}

function confirmSubmit() {
    alert("Congrats of finishing.");
}

function toggleClarification() {
    $("#clarificationDiv").toggle()
}
