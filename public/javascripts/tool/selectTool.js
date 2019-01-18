

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
  if (event.key == 'u') {
    alert("Please select an annotation first.");
  }
  if (event.key == 'y') {
    alert("Please select an annotation first.");
  }
  if (event.key == 'backspace') {
    alert("Please select an annotation first.");
  }
  if (event.key == 'escape') {
    background.focus();
  }
  if (event.key == 'i') {
    annotations.styleInverted = ( ! annotations.styleInverted);
    this.refreshTool();
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
  deactivateButton(this.toolName);
}
selectTool.switch = function(annotation) {
  var lastCurserPosition = (paper.tool.curser) ? paper.tool.curser.position : background.viewCenter;
  var lastToolSize = parseInt(toolSlider.value);
  
  this.toolName = "selectTool";
  console.log("Switching to", this.toolName);
  paper.tool.deactivate();
  this.activate();
  activateButton(this.toolName);

  this.annotation = annotation;
  this.curser = new Shape.Circle(lastCurserPosition, 1);
  this.toolSize = lastToolSize;

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
selectTool.getNearestAnnotation = function(point) {
  var minDist = null;
  var nearestAnnotation = null;
  for (var i = 0; i < annotations.length; i++) {
    var dist = point.getDistance(annotations[i].boundary.getNearestPoint(point));
    if (minDist == null || dist < minDist) {
      minDist = dist;
      nearestAnnotation = annotations[i];
    }
  }
  return nearestAnnotation;
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
