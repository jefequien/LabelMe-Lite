


var brushTool = new Tool();

brushTool.onMouseMove = function(event) {
  this.curser.position = event.point;
  this.updateSmartBrush();
  // Set mode
  var pixel = background.getPixel(this.curser.position);
  if (this.annotation.containsPixel(pixel)) {
    this.mode = "unite";
  } else {
    this.mode = "subtract";
  }
  this.enforceStyles();
}
brushTool.onMouseDrag = function(event) {
  this.curser.position = event.point;
  this.updateSmartBrush();
  this.enforceStyles();
  if (this.annotation.rasterinv.visible == false) {
    this.annotation.raster.opacity = Math.max(this.annotation.raster.opacity, 0.5);
  }

  this.editAnnotation();
}
brushTool.onMouseDown = function(event) {
  brushTool.onMouseDrag(event);
}
brushTool.editAnnotation = function() {
  var shape = this.curser;
  if (this.smartBrush.visible) {
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
    var success = this.annotation.undo();
    if (success) {
      brushTool.switch(this.annotation);
    } else {
      selectTool.switch();
    }
  }
  else if (event.key == 'backspace') {
    this.annotation.delete();
    selectTool.switch();
  }
  else if (event.key == 'space') {
    brush.toggle();
    if ( ! brush.active) {
      this.curser.visible = true;
      this.smartBrush.visible = false;
      this.smartBrush.selected = false;
    } else {
      this.curser.visible = false;
      this.smartBrush.visible = true;
      this.smartBrush.selected = true;
    }
    this.refreshTool();
  }
  else if (event.key == 'v') {
    brush.toggleVisualize();
  }
}
brushTool.deactivate = function() {
  this.curser.remove();
  this.smartBrush.remove();
  this.annotation.updateBoundary();
}
brushTool.switch = function(annotation) {
  this.toolName = "brushTool";
  console.log("Switching to", this.toolName);
  paper.tool.deactivate();
  this.curser = new Shape.Circle(paper.tool.curser.position, 1);
  this.activate();

  this.annotation = annotation;
  this.annotation.updateRasterInv();
  if (background.lastFocus != this.annotation) {
    background.focus(this.annotation);
  }

  for (var i = 0; i < annotations.length; i++) {
    annotations[i].hide();
  }
  this.annotation.unhide();

  // Compute toolSize
  var scale = background.image.bounds.height/background.image.height; // Points per pixel
  var annSize = Math.min(this.annotation.boundary.bounds.height, this.annotation.boundary.bounds.width) / scale;
  this.toolSize = Math.max(1, 2 * Math.sqrt(annSize));

  this.smartBrush = new Path();
  this.smartBrush.visible = false;

  this.refreshTool();
  if (this.annotation.deleted) {
    selectTool.switch();
  }
}
brushTool.refreshTool = function() {
  brushTool.onMouseMove({point: brushTool.curser.position});
}
brushTool.enforceStyles = function() {
  // Curser and annotation styles
  var scale = background.image.bounds.height/background.image.height // Points per pixel
  this.curser.scale((this.toolSize * scale) / this.curser.bounds.height);
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
}


//
// Exports
//
window.brushTool = brushTool;
