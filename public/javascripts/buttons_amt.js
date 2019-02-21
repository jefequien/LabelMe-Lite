/**
 * Buttons
 */
var buttons = {};

//
// Edit Buttons
//
buttons["undo"] = document.getElementById('undo');
buttons["undo"].title = "Undo: 'u'";
buttons["undo"].onclick = function() {
    paper.tool.onKeyDown({key: 'u'});
}
buttons["redo"] = document.getElementById('redo');
buttons["redo"].title = "Redo: 'y'";
buttons["redo"].onclick = function() {
    paper.tool.onKeyDown({key: 'y'});
}

//
// View Buttons
//
buttons["decreaseBrightness"] = document.getElementById('decreaseBrightness');
buttons["decreaseBrightness"].title = "Decrease brightness";
buttons["decreaseBrightness"].onclick = function() {
    background.decreaseBrightness();
}
buttons["increaseBrightness"] = document.getElementById('increaseBrightness');
buttons["increaseBrightness"].title = "Increase brightness";
buttons["increaseBrightness"].onclick = function() {
    background.increaseBrightness();
}
buttons["color"] = document.getElementById('color');
buttons["color"].title = "Change colors: 'c'";
buttons["color"].onclick = function() {
    paper.tool.onKeyDown({key: 'c'});
}
buttons["hide"] = document.getElementById('hide');
buttons["hide"].title = "Hide/show: 'h'";
buttons["hide"].onclick = function() {
    paper.tool.onKeyDown({key: 'h'});
}
var toolSlider = document.getElementById('toolSlider');
toolSlider.value = 6;
toolSlider.defaultValue = 6;
toolSlider.title = "Tool Size: '9','0' \n 'r' to reset";
toolSlider.oninput = function() {
    paper.tool.toolSize = parseInt(toolSlider.value);
    paper.tool.refreshTool();
}


function flashButton(name) {
    if (buttons[name]) {
        buttons[name].className += " active";
        setTimeout(function(){ buttons[name].className = buttons[name].className.replace(" active", ""); }, 100);
    } else {
        // console.log("Button not found:", name);
    }
}
function activateButton(name) {
    if (buttons[name]) {
        buttons[name].className += " active";
    } else {
        // console.log("Button not found:", name);
    }
}
function deactivateButton(name) {
    if (buttons[name]) {
        buttons[name].className = buttons[name].className.replace(" active", "");
    } else {
        // console.log("Button not found:", name);
    }
}
window.flashButton = flashButton;
window.activateButton = activateButton;
window.deactivateButton = deactivateButton;
