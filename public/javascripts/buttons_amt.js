/**
 * Buttons
 */
var buttons = {};

//
// Tools
//
buttons["editTool"] = document.getElementById('editTool');
buttons["editTool"].title = "Edit tool: '2'";
buttons["editTool"].onclick = function() {
    paper.tool.onKeyDown({key: '2'});
}
buttons["brushTool"] = document.getElementById('brushTool');
buttons["brushTool"].title = "Brush tool: '3'";
buttons["brushTool"].onclick = function() {
    paper.tool.onKeyDown({key: '3'});
}

//
// Zoom Buttons
//
buttons["zoomIn"] = document.getElementById('zoomIn');
buttons["zoomIn"].title = "Zoom in: 'e'";
buttons["zoomIn"].onclick = function() {
    var p = paper.tool.curser.position;
    paper.tool.curser.position = background.viewCenter;
    paper.tool.onKeyDown({key: 'e'});
    paper.tool.curser.position = p;
    paper.tool.refreshTool();
}
buttons["zoomOut"] = document.getElementById('zoomOut');
buttons["zoomOut"].title = "Zoom out: 'q'";
buttons["zoomOut"].onclick = function() {
    var p = paper.tool.curser.position;
    paper.tool.curser.position = background.viewCenter;
    paper.tool.onKeyDown({key: 'q'});
    paper.tool.curser.position = p;
    paper.tool.refreshTool();
}
buttons["focus"] = document.getElementById('focus');
buttons["focus"].title = "Focus: 'f'";
buttons["focus"].onclick = function() {
    paper.tool.onKeyDown({key: 'f'});
}

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

//
// Movement buttons
//
buttons["up"] = document.getElementById('up');
buttons["up"].title = "Up: 'w'";
buttons["up"].onclick = function() {
    paper.tool.onKeyDown({key: 'w'});
}
buttons["down"] = document.getElementById('down');
buttons["down"].title = "Down: 's'";
buttons["down"].onclick = function() {
    paper.tool.onKeyDown({key: 's'});
}
buttons["left"] = document.getElementById('left');
buttons["left"].title = "Left: 'a'";
buttons["left"].onclick = function() {
    paper.tool.onKeyDown({key: 'a'});
}
buttons["right"] = document.getElementById('right');
buttons["right"].title = "Right: 'd'";
buttons["right"].onclick = function() {
    paper.tool.onKeyDown({key: 'd'});
}


function flashButton(name) {
    if (buttons[name]) {
        buttons[name].className += " active";
        setTimeout(function(){ buttons[name].className = buttons[name].className.replace(" active", ""); }, 100);
    } else {
        console.log("Button not found:", name);
    }
}
function activateButton(name) {
    if (buttons[name]) {
        buttons[name].className += " active";
    } else {
        console.log("Button not found:", name);
    }
}
function deactivateButton(name) {
    if (buttons[name]) {
        buttons[name].className = buttons[name].className.replace(" active", "");
    } else {
        console.log("Button not found:", name);
    }
}
window.flashButton = flashButton;
window.activateButton = activateButton;
window.deactivateButton = deactivateButton;
