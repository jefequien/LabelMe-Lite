

var selectTool = new Tool();
selectTool.onMouseMove = function(event) {
  this.curser.position = event.point;
  // Highlight one annotation. Unhighlight everything else.
  var annotation = this.getAnnotationAt(this.curser.position);
  for (var i = 0; i < annotations.length; i++) {
    if (annotations[i] == annotation) {
      annotations[i].highlight();
    } else {
      annotations[i].unhighlight();
    }
  }
}
selectTool.onMouseUp = function(event) {
  if (this.isDragging) {
    this.isDragging = false;
    return;
  }

  var annotation = this.getAnnotationAt(this.curser.position);
  if (annotation != null) {
    editTool.switch(annotation);
  }
}
selectTool.onMouseDrag = function(event) {
  background.move(event.delta);
  this.isDragging = true;
}
selectTool.onKeyDown = function(event) {
  // Zoom keys
  if (event.key == '9') {
    zoomOut();
    return false;
  }
  if (event.key == '0') {
    zoomIn();
    return false;
  }
  if (event.key == 'f') {
    background.focus();
    return false;
  }

  // Escape keys
  if (event.key == 'escape'
    || event.key == 'backspace'
    || event.key == 'q') {
    background.focus();
    return false;
  }

  // Tool keys
  if (event.key == 'n') {
    newTool.switch();
    return false;
  }
  if (event.key == 'e') {
    var annotation = this.getAnnotationAt(this.curser.position);
    if (annotation) {
      editTool.switch(annotation);
    }
    return false;
  }
  if (event.key == 'b') {
    var annotation = this.getAnnotationAt(this.curser.position);
    if (annotation) {
      brushTool.switch(annotation);
    }
    return false;
  }
  if (event.key == 'space') {
    scissors.toggle();
    return false;
  }
  if (event.key == 'v') {
    scissors.toggleVisualize();
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
  this.curser = new Shape.Circle(background.canvas_center);
  this.activate();

  for (var i = 0; i < annotations.length; i++) {
    annotations[i].unhighlight();
  }
}
selectTool.getAnnotationAt = function(point) {
  for (var i = 0; i < annotations.length; i++) {
    if (annotations[i].boundary.contains(point)) {
      return annotations[i];
    }
  }
  return null;
}

window.selectTool = selectTool;
