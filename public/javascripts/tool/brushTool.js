


var brushTool = new Tool();

brushTool.onMouseMove = function(event) {
  this.curser.position = event.point;
  // Set mode
  if (this.annotation.boundary.contains(this.curser.position)) {
    this.mode = "unite";
  } else {
    this.mode = "subtract";
  }

  // Curser and annotation styles
  this.curser.radius = this.toolSize;
  if (this.mode == "unite") {
    this.curser.fillColor = "#00FF00";
    this.annotation.unhighlight();
  } else {
    this.curser.fillColor = "red";
    this.annotation.highlight();
  }
  this.annotation.boundary.strokeColor = "gold";
  this.annotation.boundary.strokeWidth = 3;
}
brushTool.onMouseDrag = function(event) {
  this.curser.position = event.point;
  this.annotation.boundary.strokeWidth = 0;

  if (this.mode == "unite") {
    this.annotation.unite(this.curser);
  } else {
    this.annotation.subtract(this.curser);
  }
}
brushTool.onMouseDown = function(event) {
  brushTool.onMouseDrag(event);
}
brushTool.onMouseUp = function(event) {
  this.annotation.refresh();
  this.refresh();
}
brushTool.onKeyDown = function(event) {
  // Zoom keys
  if (event.key == '9') {
    zoomOut(this.curser.position);
    return false;
  }
  if (event.key == '0') {
    zoomIn(this.curser.position);
    return false;
  }
  if (event.key == 'f') {
    background.focus(this.annotation);
    return false;
  }

  // Escape keys
  if (event.key == 'escape' || event.key == 'q') {
    selectTool.switch();
    return false;
  }
  if (event.key == 'backspace') {
    this.annotation.delete();
    selectTool.switch();
    return false;
  }
  
  // Tool keys
  if (event.key == 'o') {
    decreaseToolSize();
    return false;
  }
  if (event.key == 'p') {
    increaseToolSize();
    return false;
  }
  if (event.key == 'e') {
    editTool.switch(this.annotation);
    return false;
  }
}
brushTool.deactivate = function() {
  this.curser.remove();
}
brushTool.switch = function(annotation) {
  this.toolName = "brushTool";
  console.log("Switching to", this.toolName);
  paper.tool.deactivate();
  this.curser = new Shape.Circle(paper.tool.curser.position);
  this.activate();

  this.annotation = annotation;
  for (var i = 0; i < annotations.length; i++) {
    annotations[i].hide();
  }
  this.annotation.unhighlight();

  this.toolSize = 15;

  this.activate();
  this.refresh();
}
brushTool.refresh = function() {
  var fakeEvent = {point: brushTool.curser.position};
  brushTool.onMouseMove(fakeEvent);
}


//
// Exports
//
function increaseToolSize() {
  brushTool.toolSize *= 1.25;
  brushTool.refresh();
}
function decreaseToolSize() {
  brushTool.toolSize *= 0.8;
  brushTool.refresh();
}

window.brushTool = brushTool;
