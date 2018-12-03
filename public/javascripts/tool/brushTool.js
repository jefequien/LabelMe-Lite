


var brushTool = new Tool();

brushTool.onMouseMove = function(event) {
  this.curser.position = event.point;
  this.snapCurser();

  // Set this.annotation
  if ( ! this.annotationFixed) {
    this.annotation = selectTool.getAnnotationAt(this.curser.position);
  }
  this.setMode();

  this.enforceStyles();
  this.writeHints();
}

brushTool.onMouseDrag = function(event) {
  this.curser.position = event.point;
  this.snapCurser();

  this.editAnnotation();

  this.enforceStyles();
  this.writeHints();
}
brushTool.onMouseDown = function(event) {
  if (this.annotation) {
    this.annotationFixed = true;
  }
  this.onMouseMove(event);
  this.onMouseDrag(event);
}
brushTool.onMouseUp = function(event) {
  if (this.annotation) {
    this.annotation.updateBoundary();
  }
}
brushTool.onKeyDown = function(event) {
  this.editKeys(event);
  if (event.key == 'v') {
    brush.toggleVisualize();
  }
  onKeyDownShared(event);
}
brushTool.editKeys = function(event) {
  if ( ! this.annotation) {
    alert("Please select an annotation first.");
    return false;
  }

  if (event.key == 'u') {
    flashButton(undoAnnButton);
    this.annotation.undo();
  }
  else if (event.key == 'y') {
    flashButton(redoAnnButton);
    this.annotation.redo();
  }
  else if (event.key == 'backspace') {
    flashButton(deleteButton);
    var deleted = this.annotation.delete();
    if (deleted) {
      selectTool.switch();
    }
  }
}
brushTool.deactivate = function() {
  this.button.className = this.button.className.replace(" active", "");
  this.curser.remove();
}
brushTool.switch = function(annotation) {
  this.toolName = "Brush Tool";
  console.log("Switching to", this.toolName);
  var lastCurserPosition = paper.tool.curser.position;
  var lastToolSize = paper.tool.toolSize;
  paper.tool.deactivate();
  this.activate();

  this.button = brushToolButton;
  this.button.className += " active";
  this.curser = new Shape.Circle(lastCurserPosition, 1);
  this.toolSize = lastToolSize;

  this.annotation = annotation;
  this.annotationFixed = (this.annotation != null);

  this.refreshTool();
}
brushTool.refreshTool = function() {
  brushTool.onMouseMove({point: brushTool.curser.position});
}

//
// Edit Actions
//
brushTool.editAnnotation = function() {
  if (this.annotation) {
    if (this.mode == "unite") {
      this.annotation.unite(this.curser);
    } else {
      this.annotation.subtract(this.curser);
    }
  }
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
brushTool.setMode = function() {
  this.mode = "subtract";
  if (this.annotation && this.annotation.containsPoint(this.curser.position)) {
    this.mode = "unite";
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
  if ( ! this.annotationFixed) {
    this.curser.fillColor = "red";
  }
}

brushTool.writeHints = function() {
  var hints = [];
  if ( ! this.annotationFixed) {
    hints.push("Click on an annotation to begin editing.");
  }
  hints.push("Press '9' or '0' to change brush size.");
  // hints.push("Press 'esc' to quit.");
  $('#toolName').text(this.toolName);
  $('#toolMessage').text(hints[0]);
}


//
// Exports
//
window.brushTool = brushTool;
