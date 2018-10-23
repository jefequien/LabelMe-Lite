


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
  if (this.annotation.rasterinv.visible == false) {
    if ( this.annotation.intersects(this.curser)) {
      this.annotation.raster.opacity = Math.max(this.annotation.raster.opacity, 0.5);
    }
  }
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
  console.log(brush.active);
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
  if (event.key == '[') {
    decreaseToolSize();
    return false;
  }
  if (event.key == ']') {
    increaseToolSize();
    return false;
  }
  if (event.key == 'space') {
    editTool.switch(this.annotation);
    return false;
  }
  if (event.key == 's') {
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
    this.refresh();
    return false;
  }
  if (event.key == 'i') {
    if (this.annotation.rasterinv.visible) {
      this.annotation.rasterinv.visible = false;
    } else {
      this.annotation.rasterinv.visible = true;
    }
  }
  if (event.key == 'v') {
    brush.toggleVisualize();
    return false;
  }
}
brushTool.deactivate = function() {
  this.curser.remove();
  this.smartBrush.remove();
  this.annotation.boundary.visible = true;
  this.annotation.raster.visible = true;
  this.annotation.rasterinv.visible = false;
  this.annotation.refresh();
}
brushTool.switch = function(annotation) {
  this.toolName = "brushTool";
  console.log("Switching to", this.toolName);
  paper.tool.deactivate();
  this.curser = new Shape.Circle(paper.tool.curser.position, 1);
  this.activate();

  this.annotation = annotation;
  for (var i = 0; i < annotations.length; i++) {
    annotations[i].hide();
  }
  this.annotation.highlight();
  this.annotation.boundary.visible = false;
  this.annotation.rasterinv.visible = false;
  if (background.image_focused) {
    background.focus(this.annotation);
  }

  var scale = background.image.bounds.height/background.image.height; // Points per pixel
  var annSize = Math.min(this.annotation.boundary.bounds.height, this.annotation.boundary.bounds.width) / scale;
  this.toolSize = Math.max(1, 1.3 * Math.sqrt(annSize));

  this.smartBrush = new Path();
  this.smartBrush.visible = false;

  this.activate();
  this.refresh();
}
brushTool.refresh = function() {
  var fakeEvent = {point: brushTool.curser.position};
  brushTool.onMouseMove(fakeEvent);
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
