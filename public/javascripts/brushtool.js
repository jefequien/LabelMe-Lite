
var brushTool = new Tool();
brushTool.onMouseMove = function(event) {
  this.curser.position = event.point;
}

brushTool.onMouseDown = function(event) {
  this.unite = this.annotation.boundary.contains(event.point);
  this.onMouseDrag(event);
}

brushTool.onMouseDrag = function(event) {
  this.onMouseMove(event);
  if (this.unite) {
    this.annotation.unite(this.curser);
  } else {
    this.annotation.subtract(this.curser)
  }
}
brushTool.onMouseUp = function(event) {
  this.annotation.updateBoundary();
  if (this.annotation.boundary.area == 0) {
    this.annotation.delete();
    selectTool.switch();
  }
}
brushTool.changeToolSize = function(change) {
  new_radius = Math.max(curser.radius * change, 5);
  this.curser.radius = new_radius;
}
brushTool.onKeyDown = function(event) {
  // Quit annotate tool
  if (event.key == 'escape') {
    selectTool.switch();
    return false;
  }
  if (event.key == 'backspace') {
    this.annotation.delete();
    selectTool.switch();
    return false;
  }
  if (event.key == 'n') {
    newTool.switch();
    return false;
  }
  if (event.key == '9') {
    this.changeToolSize(0.8);
    return false;
  }
  if (event.key == '0') {
    this.changeToolSize(1.25);
    return false;
  }
  if (event.key == 'f') {
    background.focus(this.annotation);
    return false;
  }
}
brushTool.deactivate = function() {
  this.annotation.unhighlight();
  this.curser.remove();
}
brushTool.switch = function(annotation) {
  console.log("Switching to brushTool");
  this.annotation = annotation;
  this.annotation.highlight();

  this.curser = new Shape.Circle({
    center: paper.tool.curser.position,
    radius: 20,
    strokeColor: 'black',
    strokeWidth: 2,
    fillColor: 'white'
  });

  paper.tool.deactivate();
  this.activate();
}
