

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
    this.save();
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
    this.undo();
    flashButton("undo");
  }
  else if (event.key == 'y') {
    this.redo();
    flashButton("redo");
  }
  else if (event.key == 'backspace') {
    for (var i = 0; i < this.points.length; i++) {
      this.points[i].remove();
    }
    this.points = [];
    this.save();
    this.refreshTool();
    flashButton("delete");
  }
}
newTool.deactivate = function() {
  this.curser.remove();
  for (var i = 0; i < this.points.length; i++) {
    this.points[i].remove();
  }
  for (var i = 0; i < this.segments.length; i++) {
    this.segments[i].remove();
  }

  deactivateButton(this.toolName);
}
newTool.switch = function () {
  var lastCurserPosition = paper.tool.curser.position;
  var lastToolSize = paper.tool.toolSize;

  this.toolName = "newTool";
  console.log("Switching to", this.toolName);
  paper.tool.deactivate();
  this.activate();
  activateButton(this.toolName);

  this.annotation = null;
  this.curser = new Shape.Circle(lastCurserPosition, 1);
  this.toolSize = lastToolSize;

  this.points = [];
  this.segments = [];
  this.undoHistory = [];
  this.redoHistory = [];

  this.curserLoopedBack = false;

  this.refreshTool();
}
newTool.refreshTool = function() {
  newTool.onMouseMove({point: newTool.curser.position});
}
newTool.undo = function() {
  if (this.undoHistory.length != 0) {
    var checkpoint = this.undoHistory.pop();
    this.redoHistory.push(checkpoint);
    if (this.undoHistory.length == 0) {
      this.restore([]);
    } else {
      this.restore(this.undoHistory[this.undoHistory.length-1]);
    }
    this.refreshTool();
    return true;
  }
  return false;
}
newTool.redo = function() {
  if (this.redoHistory != 0) {
    var checkpoint = this.redoHistory.pop();
    this.undoHistory.push(checkpoint);
    this.restore(checkpoint);
    this.refreshTool();
    return true;
  }
  return false;
}
newTool.restore = function(checkpoint) {
  for (var i = 0; i < this.points.length; i++) {
    this.points[i].remove();
  }
  this.points = [];

  for (var i = 0; i < checkpoint.length; i++) {
    var point = this.curser.clone();
    point.position = background.getPoint(checkpoint[i]);
    this.points.push(point);
  }
}
newTool.save = function() {
  var checkpoint = [];
  for (var i = 0; i < this.points.length; i++) {
    var pixel = background.getPixel(this.points[i].position);
    checkpoint.push(pixel);
  }
  this.undoHistory.push(checkpoint);
  this.redoHistory = [];
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
  this.annotation.updateMask();
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
  if (this.points.length <= 2) {
    hints.push("Click to drop points. Points are draggable.");
  }
  if (this.points.length <= 4) {
    hints.push("Close loop to create new annotation.");
  }
  hints.push("Press 'esc' to quit.");

  $('#toolName').text(this.toolName);
  $('#toolMessage').text(hints[0]);
}

//
// Exports
//
window.newTool = newTool;
