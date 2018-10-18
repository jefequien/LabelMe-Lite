
var selectTool = new Tool();
selectTool.onMouseMove = function(event) {
  // Highlight top annotation. Unhighlight everything else.
  var topAnn = this.getTopMostAnnotation(event);
  for (var i = 0; i < annotations.length; i++) {
    var ann = annotations[i];
    if (ann == topAnn) {
      if ( ! ann.highlighted) {
        ann.highlight();
      }
    } else {
      if (ann.highlighted) {
        ann.unhighlight();
      }
    }
  }
}
selectTool.onMouseDrag = function(event) {
  background.move(event.delta);
}
selectTool.onDoubleClick = function(event) {
  var topAnn = this.getTopMostAnnotation(event)
  if (topAnn) {
    editTool.switch(topAnn);
  }
}
selectTool.onKeyDown = function(event) {
  if (event.key == '9') {
    zoomOut();
    return false;
  }
  if (event.key == '0') {
    zoomIn();
    return false;
  }
  if (event.key == 'f' || event.key == 'escape') {
    background.focus();
    return false;
  }
  if (event.key == 'n') {
    newTool.switch();
    return false;
  }
}
selectTool.deactivate = function() {
}
selectTool.switch = function() {
  console.log("Switching to selectTool");
  paper.tool.deactivate();

  for (var i = 0; i < annotations.length; i++) {
    annotations[i].unhighlight();
  }

  this.activate();
}
selectTool.getTopMostAnnotation = function(event) {
  for (var i = 0; i < annotations.length; i++) {
    if (annotations[i].boundary.contains(event.point)) {
      return annotations[i];
    }
  }
}

window.selectTool = selectTool;
