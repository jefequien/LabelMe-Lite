/**
 * Buttons
 */

var downloadImgButton = document.getElementById('downloadImg');
downloadImgButton.onclick = function(){
    var newTab = window.open(background.image.source);
}
var downloadAnnButton = document.getElementById('downloadAnn');
downloadAnnButton.onclick = function(){
    var out = {};
    out["annotations"] = saveAnnotations();

    var newTab = window.open();
    newTab.document.write('<textarea disabled style="width:100%;height:100%">' + JSON.stringify(out, null, 2) + "</textarea>");
    newTab.document.close();
}
var prevButton = document.getElementById('prevImage');
prevButton.onclick = function(){
    prevImage();
}
var nextButton = document.getElementById('nextImage');
nextButton.onclick = function(){
    nextImage();
}

//
// Movement buttons
//
var upButton = document.getElementById('up');
upButton.title = "Up: 'w'";
upButton.onclick = function(){
    paper.tool.onKeyDown({key: 'w'});
}
var downButton = document.getElementById('down');
downButton.title = "Down: 's'";
downButton.onclick = function(){
    paper.tool.onKeyDown({key: 's'});
}
var leftButton = document.getElementById('left');
leftButton.title = "Left: 'a'";
leftButton.onclick = function(){
    paper.tool.onKeyDown({key: 'a'});
}
var rightButton = document.getElementById('right');
rightButton.title = "Right: 'd'";
rightButton.onclick = function(){
    paper.tool.onKeyDown({key: 'd'});
}
var zoomOutButton = document.getElementById('zoomOut');
zoomOutButton.title = "Zoom out: 'q'";
zoomOutButton.onclick = function(){
    paper.tool.curser.position = null;
    paper.tool.onKeyDown({key: 'q'});
}
var zoomInButton = document.getElementById('zoomIn');
zoomInButton.title = "Zoom in: 'e'";
zoomInButton.onclick = function(){
    paper.tool.curser.position = null;
    paper.tool.onKeyDown({key: 'e'});
}
var focusButton = document.getElementById('focus');
focusButton.title = "Focus: 'f'";
focusButton.onclick = function(){
    paper.tool.onKeyDown({key: 'f'});
}
var hideButton = document.getElementById('hide');
hideButton.title = "Toggle hide: 'h'";
hideButton.onclick = function(){
    paper.tool.onKeyDown({key: 'h'});
}

//
// Tool buttons
//
var selectToolButton = document.getElementById('selectTool');
selectToolButton.title = "Select tool: '1'";
selectToolButton.onclick = function(){
    paper.tool.onKeyDown({key: '1'});
}
var editToolButton = document.getElementById('editTool');
editToolButton.title = "Edit tool: '2'";
editToolButton.onclick = function(){
    paper.tool.onKeyDown({key: '2'});
}
var brushToolButton = document.getElementById('brushTool');
brushToolButton.title = "Brush tool: '3'";
brushToolButton.onclick = function(){
    paper.tool.onKeyDown({key: '3'});
}
var newToolButton = document.getElementById('newTool');
newToolButton.title = "New tool: '4'";
newToolButton.onclick = function(){
    paper.tool.onKeyDown({key: '4'});
}
