


var selectTool = new Tool();
selectTool.onMouseMove = function(event) {
  this.curser.position = event.point;
  // Highlight top annotation. Unhighlight everything else.
  var topAnn = this.getTopMostAnnotation(this.curser.position);
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
selectTool.onMouseUp = function(event) {
  if (this.isDragging) {
    this.isDragging = false;
    return;
  }

  var topAnn = this.getTopMostAnnotation(this.curser.position);
  if (topAnn) {
    editTool.switch(topAnn);
  }
}
selectTool.onMouseDrag = function(event) {
  background.move(event.delta);
  this.isDragging = true;
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
  if (this.curser) {
    this.curser.remove();
  }
}
selectTool.switch = function() {
  this.toolName = "selectTool";
  console.log("Switching to", this.toolName);

  paper.tool.deactivate();
  this.curser = new Shape.Circle();
  this.activate();

  for (var i = 0; i < annotations.length; i++) {
    annotations[i].unhighlight();
  }
}
selectTool.getTopMostAnnotation = function(point) {
  for (var i = 0; i < annotations.length; i++) {
    if (annotations[i].boundary.contains(point)) {
      return annotations[i];
    }
  }
}

window.selectTool = selectTool;
