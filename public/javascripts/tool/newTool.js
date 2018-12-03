

var newTool = new Tool();
newTool.onMouseMove = function(event) {
  this.curser.position = event.point;
  this.snapCurser();
  this.drawSegments();

  // Check if looped back
  this.curserLoopedBack = false;
  if (this.curser.intersects(this.points[0]) && this.points.length >= 2) {
    this.curserLoopedBack = true;
  }

  this.enforceStyles();
  this.writeHints();
}
newTool.onMouseClick = function(event) {
  this.onMouseMove(event);

  if (this.curserLoopedBack) {
    this.name = prompt("Please enter a name for this object.", "");
    if (this.name == null) {
      return;
    }

    if (this.name == "") {
      alert("Please enter a name.");
    } else {
      this.createAnnotation();
      selectTool.switch();
    }
  } else {
    this.points.push(this.curser.clone());
    this.removedPoints = [];
    this.refreshTool();
  }
}
newTool.onMouseDown = function(event) {
  this.dragDelta = 0;
  // Set this.dragPoint
  this.dragPoint = null;
  for (var i = 0; i < this.points.length; i++) {
    if (this.curser.intersects(this.points[i])) {
      this.dragPoint = this.points[i];
    }
  }
}
newTool.onMouseDrag = function(event) {
  this.curser.position = event.point;
  this.dragDelta += event.delta.length;
  if (this.dragPoint) {
    this.dragPoint.position += event.delta;
  } else {
    background.move(event.delta);
  }
  this.refreshTool();

  // Get points to appear
  this.curserLoopedBack = false;
  this.enforceStyles();
}
newTool.onMouseUp = function(event) {
  if (this.dragDelta < 15 && this.dragPoint == null) {
    this.onMouseClick(event);
  }
  if (this.curserLoopedBack) {
    this.onMouseClick(event);
  }
}
newTool.onKeyDown = function(event) {
  this.editKeys(event);
  if (event.key == 't') {
    scissors.toggleVisualize();
  }
  onKeyDownShared(event);
}
newTool.editKeys = function(event) {
  if (event.key == 'u') {
    flashButton(undoAnnButton);
    this.removePoint();
  }
  else if (event.key == 'y') {
    flashButton(redoAnnButton);
    this.addRemovedPoint();
  }
  else if (event.key == 'backspace') {
    flashButton(deleteButton);
    while (this.points.length > 0) {
      this.removePoint();
    }
  }
}
newTool.deactivate = function() {
  this.button.className = this.button.className.replace(" active", "");
  this.curser.remove();

  for (var i = 0; i < this.points.length; i++) {
    this.points[i].remove();
  }
  for (var i = 0; i < this.segments.length; i++) {
    this.segments[i].remove();
  }
}
newTool.switch = function () {
  this.toolName = "New Tool";
  console.log("Switching to", this.toolName);
  var lastCurserPosition = paper.tool.curser.position;
  var lastToolSize = paper.tool.toolSize;
  paper.tool.deactivate();
  this.activate();

  this.button = newToolButton;
  this.button.className += " active";
  this.curser = new Shape.Circle(lastCurserPosition, 1);
  this.toolSize = lastToolSize;

  this.annotation = null;

  this.points = [];
  this.segments = [];
  this.removedPoints = [];

  this.curserLoopedBack = false;

  this.refreshTool();
}
newTool.refreshTool = function() {
  newTool.onMouseMove({point: newTool.curser.position});
}
newTool.removePoint = function() {
  if (this.points.length > 0) {
    var point = this.points.pop()
    point.remove();
    this.removedPoints.push(point);
    this.refreshTool();
    return true;
  }
  return false;
}
newTool.addRemovedPoint = function() {
  if (this.removedPoints.length > 0) {
    var point = this.curser.clone();
    point.position = this.removedPoints.pop().position;
    this.points.push(point);
    this.refreshTool();
    return true;
  }
  return false;
}

// 
// Create Annotation
//
newTool.createAnnotation = function() {
  // Join segments to form one path
  var path = new Path();
  for (var i = 0; i < this.segments.length; i++) {
    path.join(this.segments[i].clone());
  }
  path.remove();

  this.annotation = new Annotation(this.name);
  this.annotation.unite(path);
  this.annotation.updateBoundary();
}

//
// Draw
//
newTool.drawSegments = function() {
  // Clear this.segments
  for (var i = 0; i < this.segments.length; i++) {
    this.segments[i].remove();
  }
  this.segments = [];

  // Set this.segments
  var allPoints = this.points.concat([this.curser]);
  for (var i = 1; i < allPoints.length; i++) {
    var p0 = allPoints[i-1].position;
    var p1 = allPoints[i].position;
    var path = new Path(p0, p1);
    this.segments.push(path);
  }
}

// 
// Styles
//
newTool.snapCurser = function() {
  // Snap to annotation bounds
  if ( ! background.image.contains(this.curser.position)) {
    var bounds = new Path.Rectangle(background.image.bounds);
    this.curser.position = bounds.getNearestPoint(this.curser.position);
    bounds.remove();
  }

  // Snap to this.points
  for (var i = 0; i < this.points.length; i++) {
    if (this.curser.intersects(this.points[i])) {
      this.curser.position = this.points[i].position;
      break;
    }
  }
}
newTool.enforceStyles = function() {
  var pointHeight = this.toolSize * 1.5;
  var lineWidth = this.toolSize / 2;

  // Annotation styles
  for (var i = 0; i < annotations.length; i++) {
    annotations[i].hide();
  }

  // Point styles
  this.curser.fillColor = "#00FF00";
  this.curser.scale(pointHeight / this.curser.bounds.height);
  for (var i = 0; i < this.points.length; i++) {
    this.points[i].scale(pointHeight / this.points[i].bounds.height);
  }

  // Line styles
  for (var i = 0; i < this.segments.length; i++) {
    this.segments[i].strokeColor = "blue";
    this.segments[i].strokeWidth = lineWidth;
  }
  
  // Visibility
  this.curser.visible = ! this.curserLoopedBack;
  for (var i = 0; i < this.points.length; i++) {
    this.points[i].visible = ! this.curserLoopedBack;
  }
}

newTool.writeHints = function() {
  var hints = [];
  if (this.points.length == 0) {
    hints.push("Click to drop points."); 
  }
  if (this.points.length <= 2) {
    hints.push("Drag points to adjust annotation."); 
  }
  if (this.points.length <= 3) {
    hints.push("Close loop to create new annotation.");
  }
  if (this.points.length <= 5) {
    hints.push("Press 'u' to remove points.");
  }
  hints.push("Press 'esc' to quit.");

  $('#toolName').text(this.toolName);
  $('#toolMessage').text(hints[0]);
}

//
// Exports
//
window.newTool = newTool;
