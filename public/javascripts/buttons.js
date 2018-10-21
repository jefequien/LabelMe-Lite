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
var helpButton = document.getElementById('help');
helpButton.onclick = function(){

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
// Zoom buttons
//
var zoomInButton = document.getElementById('zoomIn');
zoomInButton.onclick = function(){
    zoomIn();
}
var zoomOutButton = document.getElementById('zoomOut');
zoomOutButton.onclick = function(){
    zoomOut();
}
var fitScreenButton = document.getElementById('fitScreen');
fitScreenButton.onclick = function(){
    fitScreen();
}
var lassoButton = document.getElementById('lasso');
lassoButton.onclick = function(){
    scissors.toggle();
}

//
// Tool buttons
//
var selectToolButton = document.getElementById('selectTool');
selectToolButton.onclick = function(){
    selectTool.switch();
}
var newToolButton = document.getElementById('newTool');
newToolButton.onclick = function(){
    newTool.switch();
}
var editToolButton = document.getElementById('editTool');
editToolButton.onclick = function(){
    // editTool.switch();
}
var brushToolButton = document.getElementById('brushTool');
brushToolButton.onclick = function(){
    // brushTool.switch();
}
