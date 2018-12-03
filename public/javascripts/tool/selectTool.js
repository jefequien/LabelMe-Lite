

var selectTool = new Tool();
selectTool.onMouseMove = function(event) {
  this.curser.position = event.point;

  this.annotation = this.getAnnotationAt(this.curser.position);

  this.enforceStyles();
  this.writeHints();
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
selectTool.onMouseDown = function(event) {
  this.dragDelta = 0;
}
selectTool.onMouseDrag = function(event) {
  this.dragDelta += event.delta.length;
  background.move(event.delta);
  this.onMouseMove(event);
}
selectTool.onMouseUp = function(event) {
  if (this.dragDelta < 15) {
    this.onMouseClick(event);
  }
}
selectTool.onKeyDown = function(event) {
  this.editKeys(event);
  if (event.key == 'escape') {
    background.focus();
  }
  if (event.key == 'i') {
    annotations.styleInverted = ( ! annotations.styleInverted);
    this.refreshTool();
  }
  onKeyDownShared(event);
}
selectTool.editKeys = function(event) {
  if (event.key == 'u') {
    alert("Please select an annotation first.");
  }
  if (event.key == 'y') {
    alert("Please select an annotation first.");
  }
  if (event.key == 'backspace') {
    alert("Please select an annotation first.");
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
selectTool.switch = function(annotation) {
  this.toolName = "Select Tool";
  console.log("Switching to", this.toolName);

  var lastCurserPosition = (paper.tool.curser) ? paper.tool.curser.position : new Point(0,0);
  var lastToolSize = parseInt(toolSlider.value);
  paper.tool.deactivate();
  this.activate();

  this.button = selectToolButton;
  this.button.className += " active";
  this.curser = new Shape.Circle(lastCurserPosition, 1);
  this.toolSize = lastToolSize;

  this.annotation = annotation;
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

//
// Styles
//
selectTool.enforceStyles = function() {
  // Annotation styles
  for (var i = 0; i < annotations.length; i++) {
    if (annotations[i] != this.annotation) {
      annotations[i].unhighlight();
    } else {
      this.annotation.highlight();
    }
  }
}
selectTool.writeHints = function() {
  var hints = [];
  hints.push("Click on an annotation to begin editing.");
  
  $('#toolName').text(this.toolName);
  $('#toolMessage').text(hints[0]);
}

window.paper = paper;
window.selectTool = selectTool;
