


var brushTool = new Tool();

brushTool.onMouseMove = function(event) {
  this.curser.position = event.point;
  // Set mode
  if (this.annotation.containsPoint(this.curser.position)) {
    this.mode = "unite";
  } else {
    this.mode = "subtract";
  }
  this.enforceStyles();
  this.updateSmartBrush();
}
brushTool.onMouseDrag = function(event) {
  this.curser.position = event.point;
  this.enforceStyles();
  this.updateSmartBrush();

  this.editAnnotation();
}
brushTool.onMouseDown = function(event) {
  brushTool.onMouseDrag(event);
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
    var num = this.toolSize * this.toolSize;
    var p = background.getPixel(this.curser.position);
    var pixels = brush.getNearestPixels([p.x, p.y], num);
    var path = new Path(pixels);
    path.remove();
    background.toPointSpace(path);
    this.smartBrush.segments = path.segments;
  }
}
brushTool.onKeyDown = function(event) {
  onKeyDownShared(event);
  if (event.key == '9') {
    this.toolSize *= 0.8;
    this.refreshTool();
  }
  else if (event.key == '0') {
    this.toolSize *= 1.25;
    this.refreshTool();
  }
  else if (event.key == 'u') {
    this.annotation.undo();
    brushTool.switch(this.annotation);
  }
  else if (event.key == 'backspace') {
    this.annotation.delete();
    selectTool.switch();
  }
  else if (event.key == 'space') {
    brush.toggle();
    this.refreshTool();
  }
  else if (event.key == 'v') {
    brush.toggleVisualize();
  }
}
brushTool.deactivate = function() {
  this.button.className = this.button.className.replace(" active", "");
  this.curser.remove();
  this.smartBrush.remove();
  this.annotation.updateBoundary();
}
brushTool.switch = function(annotation) {
  this.toolName = "brushTool";
  console.log("Switching to", this.toolName);
  var lastCurserPosition = paper.tool.curser.position;
  if (annotation == null) {
    alert(this.toolName + ": Please select an annotation to edit first.");
    selectTool.switch();
    return;
  }
  paper.tool.deactivate();
  this.activate();

  this.button = brushToolButton;
  this.button.className += " active";
  this.curser = new Shape.Circle(lastCurserPosition);
  this.curser.radius = 1;

  this.annotation = annotation;
  this.annotation.updateRasterInv();
  for (var i = 0; i < annotations.length; i++) {
    annotations[i].hide();
  }

  var annSize = Math.min(this.annotation.boundary.bounds.height, this.annotation.boundary.bounds.width);
  this.toolSize = Math.max(1, Math.sqrt(annSize / background.getPixelHeight()));

  this.smartBrush = new Path();
  this.smartBrush.visible = false;

  this.refreshTool();
}
brushTool.refreshTool = function() {
  brushTool.onMouseMove({point: brushTool.curser.position});
}
brushTool.enforceStyles = function() {
  // Curser and annotation styles
  var curserSize = this.toolSize * background.getPixelHeight();
  this.curser.scale(curserSize / this.curser.bounds.height);

  if (this.mode == "unite") {
    this.curser.fillColor = "#00FF00";
    this.annotation.raster.opacity = 0.8;
    this.annotation.rasterinv.opacity = 0;
  } else {
    this.curser.fillColor = "red";
    this.annotation.raster.opacity = 0;
    this.annotation.rasterinv.opacity = 0.8;
  }
  this.annotation.boundary.strokeWidth = 0;


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


//
// Exports
//
window.brushTool = brushTool;
