


var brushTool = new Tool();
brushTool.onMouseMove = function(event) {
  this.brush.position = event.point;
  if (this.annotation.boundary.contains(this.brush.position)) {
    this.mode = "unite";
    this.brush.fillColor = "#00FF00";
  } else {
    this.mode = "subtract";
    this.brush.fillColor = "red";
  }
}
brushTool.onMouseDrag = function(event) {
  this.brush.position = event.point;
  if (this.mode == "unite") {
    this.annotation.unite(this.brush);
  } else {
    this.annotation.subtract(this.brush);
  }
}
brushTool.onMouseUp = function(event) {
  this.annotation.updateBoundary();

  if (this.annotation.boundary.area != 0) {
    editTool.switch(this.annotation);
    editTool.onMouseMove(event);
  }
}
brushTool.deactivate = function() {
  if (this.brush) {
    this.brush.remove();
  }
}
brushTool.switch = function(annotation) {
  console.log("Switching to brushTool");
  paper.tool.deactivate();

  this.brush = new Shape.Circle({
      center: [0, 0],
      radius: 15
    });

  this.annotation = annotation;
  this.annotation.unhighlight();

  this.activate();
}
brushTool.onKeyDown = function(event) {
  if (event.key == '9') {
    zoomOut();
    return false;
  }
  if (event.key == '0') {
    zoomIn();
    return false;
  }
}

window.brushTool = brushTool;
