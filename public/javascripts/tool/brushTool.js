


var brushTool = new Tool();

brushTool.onMouseMove = function(event) {
  this.curser.position = event.point;
  this.snapCurser();

  // Set this.annotation
  if ( ! this.annotationFixed) {
    this.annotation = selectTool.getAnnotationAt(this.curser.position);
    if (this.annotation == null) {
      this.annotation = selectTool.getNearestAnnotation(this.curser.position);
    }
  }

  if (this.annotation && ! this.annotation.rasterinvUpToDate) {
    this.annotation.updateRaster();
  }

  // Set this.mode
  this.mode = "subtract";
  if (this.annotation && this.annotation.containsPoint(this.curser.position)) {
    this.mode = "unite";
  }

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
  this.annotationFixed = true;
  this.onMouseDrag(event);
}
brushTool.onMouseUp = function(event) {
  if (this.annotation) {
    this.annotation.updateBoundary();
  }
}
brushTool.onKeyDown = function(event) {
  if (event.key == 'u') {
    flashButton("undo");
    this.annotation.undo();
    this.refreshTool();
  }
  else if (event.key == 'y') {
    flashButton("redo");
    this.annotation.redo();
    this.refreshTool();
  }
  
  if (event.key == 'escape') {
    selectTool.switch();
  }
  onKeyDownShared(event);
}
brushTool.deactivate = function() {
  this.curser.remove();
  deactivateButton(this.toolName);
}
brushTool.switch = function(annotation) {
  var lastAnnotation = paper.tool.annotation;
  var lastCurserPosition = paper.tool.curser.position;
  var lastToolSize = paper.tool.toolSize;

  this.toolName = "brushTool";
  console.log("Switching to", this.toolName);
  paper.tool.deactivate();
  this.activate();
  activateButton(this.toolName);

  this.annotation = lastAnnotation;
  this.annotationFixed = (this.annotation != null);
  this.curser = new Shape.Circle(lastCurserPosition, 1);
  this.toolSize = lastToolSize;

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
  var curserHeight = 0.5 * this.toolSize * this.toolSize;

  // this.annotation styles
  if (this.annotation) {
    this.annotation.highlight();
    this.annotation.boundary.strokeWidth = 0;
    if (this.mode == "unite") {
      this.annotation.raster.opacity = 0.8;
      this.annotation.rasterinv.opacity = 0;
    } else {
      this.annotation.raster.opacity = 0;
      this.annotation.rasterinv.opacity = 0.8;
    }
  }

  // Other annotations styles
  for (var i = 0; i < annotations.length; i++) {
    if (annotations[i] != this.annotation) {
      if (this.annotationFixed) {
        annotations[i].hide();
      } else {
        annotations[i].unhighlight();
      }
    }
  }

  // Curser styles
  this.curser.scale(curserHeight / this.curser.bounds.height);
  if (this.mode == "unite") {
    this.curser.fillColor = "#00FF00";
  } else {
    this.curser.fillColor = "red";
  }
}


//
// Exports
//
window.brushTool = brushTool;
