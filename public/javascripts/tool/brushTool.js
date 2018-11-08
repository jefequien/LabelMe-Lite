


var brushTool = new Tool();

brushTool.onMouseMove = function(event) {
  this.curser.position = event.point;
  this.snapCurser();

  // Set mode
  if (this.annotation.containsPoint(this.curser.position)) {
    this.mode = "unite";
  } else {
    this.mode = "subtract";
  }
  if (this.invertedMode) {
    if (this.mode == "unite") {
      this.mode = "subtract";
    } else {
      this.mode = "unite";
    }
  }

  this.enforceStyles();
  this.updateSmartBrush();
}
brushTool.onMouseDrag = function(event) {
  this.curser.position = event.point;
  this.snapCurser();

  this.enforceStyles();
  this.updateSmartBrush();

  this.editAnnotation();
}
brushTool.onMouseDown = function(event) {
  brushTool.onMouseDrag(event);
}
brushTool.onMouseUp = function(event) {
  this.annotation.updateBoundary();
}
brushTool.editAnnotation = function() {
  var shape = this.curser;
  if (brush.active) {
    shape = this.smartBrush;
  }

  if (this.mode == "unite") {
    this.annotation.unite(shape);
  } else {
    this.annotation.subtract(shape);
  }
}
brushTool.updateSmartBrush = function() {
  if (brush.active) {
    var numPixels = this.curser.bounds.height / background.getPixelHeight();
    numPixels *= numPixels;
    var p = background.getPixel(this.curser.position);
    var pixels = brush.getNearestPixels([p.x, p.y], numPixels);
    var path = new Path(pixels);
    path.remove();
    background.toPointSpace(path);
    this.smartBrush.segments = path.segments;
  }
}
brushTool.onKeyDown = function(event) {
  if (event.key == 'u') {
    this.annotation.undo();
    this.refreshTool();
  } else if (event.key == 'y') {
    this.annotation.redo();
    this.refreshTool();
  }
  else if (event.key == 'backspace') {
    this.annotation.delete();
    selectTool.switch();
  }
  else if (event.key == 'i') {
    this.invertedMode = ! this.invertedMode;
    this.refreshTool();
  }
  
  // Smart tool
  if (event.key == 't') {
    brush.toggle();
    this.refreshTool();
  }
  else if (event.key == 'space') {
    brush.toggleVisualize();
  }
  onKeyDownShared(event);
}
brushTool.deactivate = function() {
  this.button.className = this.button.className.replace(" active", "");
  this.curser.remove();
  this.smartBrush.remove();
}
brushTool.switch = function(annotation) {
  this.toolName = "brushTool";
  console.log("Switching to", this.toolName);
  var lastCurserPosition = paper.tool.curser.position;
  var lastToolSize = paper.tool.toolSize;
  if (annotation == null) {
    alert(this.toolName + ": Please select an annotation to edit first.");
    selectTool.switch();
    return;
  }
  paper.tool.deactivate();
  this.activate();

  this.button = brushToolButton;
  this.button.className += " active";
  this.curser = new Shape.Circle(lastCurserPosition, 1);
  this.toolSize = lastToolSize;

  this.annotation = annotation;
  this.annotation.updateMask();
  this.annotation.updateRasterInv();

  this.smartBrush = new Path();
  this.smartBrush.visible = false;
  this.invertedMode = false;

  this.refreshTool();
}
brushTool.refreshTool = function() {
  brushTool.onMouseMove({point: brushTool.curser.position});
}
brushTool.enforceStyles = function() {
  var curserHeight = this.toolSize * this.toolSize * background.getPixelHeight();

  // Annotation styles
  for (var i = 0; i < annotations.length; i++) {
    annotations[i].hide();
  }
  this.annotation.highlight();
  this.annotation.boundary.strokeWidth = 0;
  if (this.mode == "unite") {
    this.annotation.raster.opacity = 0.8;
    this.annotation.rasterinv.opacity = 0;
  } else {
    this.annotation.raster.opacity = 0;
    this.annotation.rasterinv.opacity = 0.8;
  }

  // Curser styles
  this.curser.scale(curserHeight / this.curser.bounds.height);
  if (this.mode == "unite") {
    this.curser.fillColor = "#00FF00";
  } else {
    this.curser.fillColor = "red";
  }

  // Inverted style
  if (this.invertedMode) {
    this.curser.fillColor = {
     gradient: {
         stops: ['black', "black", this.curser.fillColor],
         radial: true
     },
     origin: this.curser.position,
     destination: this.curser.bounds.rightCenter
    };
  }

  // Smart brush
  if ( ! brush.active) {
    this.curser.visible = true;
    this.smartBrush.visible = false;
    this.smartBrush.selected = false;
  } else {
    this.curser.visible = false;
    this.smartBrush.visible = true;
    this.smartBrush.selected = true;
  }
}
brushTool.snapCurser = function() {
  // Snap to annotation bounds
  var ann_bounds = this.annotation.raster.bounds;
  if ( ! ann_bounds.contains(this.curser.position)) {
    var rect = new Path.Rectangle(ann_bounds);
    rect.remove();
    this.curser.position = rect.getNearestPoint(this.curser.position);
  }
}


//
// Exports
//
window.brushTool = brushTool;
