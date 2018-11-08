

var selectTool = new Tool();
selectTool.onMouseMove = function(event) {
  this.curser.position = event.point;

  // Enfoce styles
  this.annotation = this.getAnnotationAt(this.curser.position);
  for (var i = 0; i < annotations.length; i++) {
    if (annotations[i] != this.annotation) {
      annotations[i].unhighlight();
    } else {
      this.annotation.highlight();
    }
  }
}
selectTool.onMouseUp = function(event) {
  if (this.isDragging) {
    this.isDragging = false;
  } else {
    this.onMouseClick(event);
  }
}
selectTool.onMouseDrag = function(event) {
  background.move(event.delta);
  this.isDragging = true;
}
selectTool.onMouseClick = function(event) {
  this.onMouseMove(event);
  if (this.annotation) {
    if (background.lastFocus != this.annotation) {
      background.focus(this.annotation);
    }
    editTool.switch(this.annotation);
  }
}
selectTool.onKeyDown = function(event) {
  if (event.key == 'escape') {
    background.focus();
  }
  onKeyDownShared(event);
}
selectTool.refreshTool = function() {
  selectTool.onMouseMove({point: selectTool.curser.position});
}
selectTool.deactivate = function() {
  if (this.curser) {
    this.curser.remove();
  }
  if (this.button) {
    this.button.className = this.button.className.replace(" active", "");
  }
}
selectTool.switch = function() {
  this.toolName = "selectTool";
  console.log("Switching to", this.toolName);
  var lastCurserPosition = background.canvasCenter;
  var lastToolSize = parseInt(toolSlider.value);
  paper.tool.deactivate();
  this.activate();

  this.button = selectToolButton;
  this.button.className += " active";
  this.curser = new Shape.Circle(lastCurserPosition, 1);
  this.toolSize = lastToolSize;

  this.annotation = null;
  this.refreshTool();
}
selectTool.getAnnotationAt = function(point) {
  for (var i = 0; i < annotations.length; i++) {
    if (annotations[i].boundary.contains(point)) {
      return annotations[i];
    }
  }
  return null;
}

window.paper = paper;
window.selectTool = selectTool;
