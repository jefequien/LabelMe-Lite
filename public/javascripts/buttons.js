//
// Buttons
//
var downloadImg = document.getElementById('downloadImg');
downloadImg.onclick = function(){
}

var downloadAnn = document.getElementById('downloadAnn');
downloadAnn.onclick = function(){

}

var help = document.getElementById('help');
help.onclick = function(){

}

var prevImage = document.getElementById('prevImage');
prevImage.onclick = function(){

}

var nextImage = document.getElementById('nextImage');
nextImage.onclick = function(){

}

var zoomIn = document.getElementById('zoomIn');
zoomIn.onclick = function(){
    annotator.zoomIn();
}

var zoomOut = document.getElementById('zoomOut');
zoomOut.onclick = function(){
    annotator.zoomOut();
}

var fitScreen = document.getElementById('fitScreen');
fitScreen.onclick = function(){
    annotator.fitScreen();
}
