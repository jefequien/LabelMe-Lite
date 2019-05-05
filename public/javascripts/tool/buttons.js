//
// Buttons
//

var buttons = {};

//
// Tool Buttons
//
buttons["selectTool"] = {}
buttons["selectTool"].onclick = function() {
    selectTool.switch();
}
buttons["editTool"] = {}
buttons["editTool"].onclick = function() {
    editTool.switch();
}
buttons["brushTool"] = {}
buttons["brushTool"].onclick = function() {
    brushTool.switch();
}
buttons["newTool"] = {}
buttons["newTool"].onclick = function() {
    newTool.switch();
}

//
// Zoom Buttons
//
buttons["zoomIn"] = {};
buttons["zoomIn"].title = "Zoom in: 'e'";
buttons["zoomIn"].onclick = function() {
    var p = paper.tool.curser.position;
    paper.tool.curser.position = background.viewCenter;
    paper.tool.onKeyDown({key: 'e'});
    paper.tool.curser.position = p;
    paper.tool.refreshTool();
}
buttons["zoomOut"] = {};
buttons["zoomOut"].title = "Zoom out: 'q'";
buttons["zoomOut"].onclick = function() {
    var p = paper.tool.curser.position;
    paper.tool.curser.position = background.viewCenter;
    paper.tool.onKeyDown({key: 'q'});
    paper.tool.curser.position = p;
    paper.tool.refreshTool();
}
buttons["focus"] = {};
buttons["focus"].title = "Focus: 'f'";
buttons["focus"].onclick = function() {
    paper.tool.onKeyDown({key: 'f'});
}

//
// View Buttons
//
buttons["decreaseBrightness"] = {};
buttons["decreaseBrightness"].title = "Decrease brightness";
buttons["decreaseBrightness"].onclick = function() {
    background.decreaseBrightness();
}
buttons["increaseBrightness"] = {}
buttons["increaseBrightness"].title = "Increase brightness";
buttons["increaseBrightness"].onclick = function() {
    background.increaseBrightness();
}
buttons["color"] = {};
buttons["color"].title = "Change colors: 'c'";
buttons["color"].onclick = function() {
    paper.tool.onKeyDown({key: 'c'});
}
buttons["hide"] = {};
buttons["hide"].title = "Hide/show: 'h'";
buttons["hide"].onclick = function() {
    paper.tool.onKeyDown({key: 'h'});
}
buttons["slider"] = {};
buttons["slider"].title = "Tool Size: '9','0'";
buttons["slider"].min = 3;
buttons["slider"].max = 15;
buttons["slider"].value = 6;
buttons["slider"].step = 0.5;
buttons["slider"].oninput = function() {
    var toolSize = parseInt(buttons["slider"].value);
    paper.tool.toolSize = toolSize;
    paper.tool.refreshTool();
}


//
// Edit Buttons
//
buttons["undo"] = {};
buttons["undo"].title = "Undo: 'u'";
buttons["undo"].onclick = function() {
    paper.tool.onKeyDown({key: 'u'});
}
buttons["redo"] = {};
buttons["redo"].title = "Redo: 'y'";
buttons["redo"].onclick = function() {
    paper.tool.onKeyDown({key: 'y'});
}
buttons["delete"] = {};
buttons["delete"].title = "Delete: 'backspace'";
buttons["delete"].onclick = function() {
    if (paper.tool.annotation) {
        var deleted = paper.tool.annotation.delete();
        if (deleted) {
          selectTool.switch();
        }
    }
}

//
// Movement buttons
//
buttons["up"] = {};
buttons["up"].title = "Up: 'w'";
buttons["up"].onclick = function() {
    paper.tool.onKeyDown({key: 'w'});
}
buttons["down"] = {};
buttons["down"].title = "Down: 's'";
buttons["down"].onclick = function() {
    paper.tool.onKeyDown({key: 's'});
}
buttons["left"] = {};
buttons["left"].title = "Left: 'a'";
buttons["left"].onclick = function() {
    paper.tool.onKeyDown({key: 'a'});
}
buttons["right"] = {};
buttons["right"].title = "Right: 'd'";
buttons["right"].onclick = function() {
    paper.tool.onKeyDown({key: 'd'});
}

//
// Download buttons
//
buttons["downloadImg"] = {};
buttons["downloadImg"].onclick = function() {
    var newTab = window.open(background.image.source);
}
buttons["downloadAnn"] = {};
buttons["downloadAnn"].onclick = function() {
    var newTab = window.open();
    var coco = saveAnnotations();
    newTab.document.write('<textarea disabled style="width:100%;height:100%">' + JSON.stringify(coco.dataset, null, 2) + "</textarea>");
    newTab.document.close();
}


function attachButton(name) {
    var button = buttons[name];
    if ( ! button) {
        return;
    }

    var buttonElement = document.getElementById(name);
    for (var key in button) {
        buttonElement[key] = button[key];
    }
    buttons[name] = buttonElement;
}
function flashButton(name) {
    var button = buttons[name];
    if ( ! button) {
        return;
    }
    if ( ! button.className) {
        button.className = "";
    }
    button.className += " active";
    setTimeout(function(){ button.className = button.className.replace(" active", ""); }, 100);
}
function activateButton(name) {
    var button = buttons[name];
    if ( ! button) {
        return;
    }
    if ( ! button.className) {
        button.className = "";
    }
    button.className += " active";
}
function deactivateButton(name) {
    var button = buttons[name];
    if ( ! button) {
        return;
    }
    if ( ! button.className) {
        button.className = "";
    }
    button.className = button.className.replace(" active", "");
}

window.buttons = buttons;
window.attachButton = attachButton;
window.flashButton = flashButton;
window.activateButton = activateButton;
window.deactivateButton = deactivateButton;
