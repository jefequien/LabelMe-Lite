

var selectTool = new Tool();
selectTool.onMouseMove = function(event) {
  this.curser.position = event.point;

  var mouseOver = this.getAnnotationAt(this.curser.position);
  for (var i = 0; i < annotations.length; i++) {
    if (annotations[i] != mouseOver) {
      annotations[i].unhighlight();
    } else {
      if ( ! mouseOver.highlighted) {
        mouseOver.highlight();
      }
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
  var mouseOver = this.getAnnotationAt(this.curser.position);
  if (mouseOver) {
    if (background.lastFocus != mouseOver) {
      background.focus(mouseOver);
    }
    editTool.switch(mouseOver);
  }
}
selectTool.onKeyDown = function(event) {
  onKeyDownShared(event)
  if (event.key == 'escape') {
    background.focus();
  }
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
  paper.tool.deactivate();
  this.activate();

  this.curser = new Shape.Circle(lastCurserPosition);
  this.button = selectToolButton;
  this.button.className += " active";
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
