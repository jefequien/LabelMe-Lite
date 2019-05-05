


var brushTool = new Tool();

brushTool.onMouseMove = function(event) {
  this.curser.position = event.point;
  this.snapCurser();

  this.annotation = selectTool.getNearestAnnotation(this.curser.position);
  this.mode = (this.annotation && this.annotation.containsPoint(this.curser.position)) ? "unite" : "subtract";

  this.enforceStyles();
}
brushTool.onMouseDrag = function(event) {
  this.curser.position = event.point;
  this.snapCurser();

  if (this.annotation) {
    if (this.mode == "unite") {
      this.annotation.unite(this.curser);
    } else {
      this.annotation.subtract(this.curser);
    }
  }

  this.enforceStyles();
}
brushTool.onMouseDown = function(event) {
  this.onMouseDrag(event);
}
brushTool.onMouseUp = function(event) {
  if (this.annotation) {
    this.annotation.updateBoundary();
  }
}
brushTool.onKeyDown = function(event) {
  if (event.key == 'u') {
    this.annotation.undo();
    this.refreshTool();
    flashButton("undo");
  }
  else if (event.key == 'y') {
    this.annotation.redo();
    this.refreshTool();
    flashButton("redo");
  }
  if (event.key == 'escape') {
    selectTool.switch();
  }
  onKeyDownShared(event);
}
brushTool.deactivate = function() {
  this.curser.remove();
  // this.rasterInv.remove();
  deactivateButton(this.toolName);
}
brushTool.switch = function() {
  var lastAnnotation = paper.tool.annotation;
  var lastCurserPosition = paper.tool.curser.position;
  var lastToolSize = paper.tool.toolSize;

  this.toolName = "brushTool";
  console.log("Switching to", this.toolName);
  paper.tool.deactivate();
  this.activate();
  activateButton(this.toolName);

  this.annotation = lastAnnotation;
  this.curser = new Shape.Circle(lastCurserPosition, 1);
  this.toolSize = lastToolSize;

  // Tool shapes
  // this.rasterInv = new Raster();
  this.refreshTool();
}
brushTool.refreshTool = function() {
  brushTool.onMouseMove({point: brushTool.curser.position});
}

//
// Styles
//
brushTool.snapCurser = function() {
  // Snap to image bounds
  if ( ! background.image.contains(this.curser.position)) {
    var rect = new Path.Rectangle(background.image.bounds);
    rect.remove();
    this.curser.position = rect.getNearestPoint(this.curser.position);
  }
}
brushTool.enforceStyles = function() {
  // Annotation styles
  for (var i = 0; i < annotations.length; i++) {
    if (annotations[i] == this.annotation) {
      annotations[i].highlight();
      annotations[i].hide();
    } else {
      annotations[i].unhighlight();
    }
  }

  // Constants
  var curserHeight = 0.5 * this.toolSize * this.toolSize;

  // Point styles
  this.curser.scale(curserHeight / this.curser.bounds.height);
  if (this.mode == "unite") {
    this.curser.fillColor = "#00FF00";
    this.annotation.raster.opacity = 1;
  } else {
    this.curser.fillColor = "red";
    this.annotation.raster.opacity = 1;
  }
}


//
// Exports
//
window.brushTool = brushTool;
