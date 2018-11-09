

var newTool = new Tool();
newTool.onMouseMove = function(event) {
  this.curser.position = event.point;
  this.snapCurser();

  // Set this.line
  if (this.points.length == 0) {
    this.line.segments = [];
  } else {
    var lastPoint = this.points[this.points.length-1].position;
    var path = this.getPath(lastPoint, this.curser.position);
    path.remove();
    this.line.segments = path.segments;
  }

  // Set this.segments
  for (var i = 1; i < this.segments.length; i++) {
    var p0 = this.points[i-1].position;
    var p1 = this.points[i].position;
    var path = this.getPath(p0, p1);
    path.remove();
    this.segments[i].segments = path.segments;
  }

  this.enforceStyles();
  this.writeHints();
}
newTool.onMouseClick = function(event) {
  this.onMouseMove(event);
  this.points.push(this.curser.clone());
  this.segments.push(this.line.clone());
  this.refreshTool();

  if (this.curserLoopedBack) {
    this.name = prompt("Please enter a name for this object.", "");
    if (this.name == null || this.name == "") {
      this.undoTool();
    } else {
      this.createAnnotation();
      selectTool.switch();
    }
  }
}
newTool.onMouseDown = function(event) {
  this.dragDelta = 0;
}
newTool.onMouseDrag = function(event) {
  background.move(event.delta);
  this.dragDelta += event.delta.length;
  if (this.dragDelta > 15) {
    this.isDragging = true;
  }
}
newTool.onMouseUp = function(event) {
  if ( ! this.isDragging) {
    this.onMouseClick(event);
  }
  this.isDragging = false;
}
newTool.onKeyDown = function(event) {
  if (event.key == 't') {
    scissors.toggle();
    this.refreshTool();
  }
  if (event.key == 'g') {
    scissors.toggleVisualize();
  }
  onKeyDownShared(event);
}
newTool.deactivate = function() {
  this.button.className = this.button.className.replace(" active", "");
  this.curser.remove();
  this.line.remove();

  for (var i = 0; i < this.points.length; i++) {
    this.points[i].remove();
  }
  for (var i = 0; i < this.segments.length; i++) {
    this.segments[i].remove();
  }

  clearInterval(this.interval);
  this.interval = null;
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

  this.line = new Path();
  this.points = [];
  this.segments = [];

  this.curserLoopedBack = false;

  this.refreshTool();
}
newTool.refreshTool = function() {
  newTool.onMouseMove({point: newTool.curser.position});
  if (scissors.active) {
    if (newTool.interval == null) {
      newTool.interval = setInterval(newTool.refreshTool, 300);
    }
  } else {
    clearInterval(newTool.interval);
    newTool.interval = null;
  }
}
newTool.undoTool = function() {
  if (this.points.length > 0) {
    this.points.pop().remove();
    this.segments.pop().remove();
    this.refreshTool();
    return true;
  }
  return false;
}
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
newTool.snapCurser = function() {
  // Snap to annotation bounds
  if ( ! background.image.contains(this.curser.position)) {
    var bounds = new Path.Rectangle(background.image.bounds);
    this.curser.position = bounds.getNearestPoint(this.curser.position);
    bounds.remove();
  }
  // Snap to first point
  if (this.points.length >= 2 && this.curser.intersects(this.points[0])) {
    this.curser.position = this.points[0].position;
    this.curserLoopedBack = true;
  } else {
    this.curserLoopedBack = false;
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
  this.line.strokeColor = "blue";
  this.line.strokeWidth = lineWidth;
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

//
// Path finding functions
//
newTool.getPath = function(start, end) {
  if (scissors.active) {
    // Try pixels along line
    var path = new Path.Line(start, end);
    background.toPixelSpace(path);
    path.remove();

    for (var i = 0; i < path.length; i+=20) {
      var p0 = path.firstSegment.point;
      var p1 = path.getPointAt(path.length-i);

      var pixelList = scissors.getPath([p0.x, p0.y], [p1.x, p1.y]);
      if (pixelList != null) {
        var newPath = new Path({"segments": pixelList});
        background.toPointSpace(newPath);

        // Smooth out path
        newPath.insert(0, start);
        newPath.add(end);
        newPath.removeSegment(1);
        newPath.removeSegment(newPath.segments.length - 2);
        return newPath;
      }
    }
  }

  var path = new Path.Line(start, end);
  return path;
}

newTool.writeHints = function() {
  var hints = [];
  if (this.points.length == 0) {
    hints.push("Click to begin new annotation."); 
  }
  if (this.points.length <= 2) {
    hints.push("Click to drop points."); 
  }
  if (this.points.length <= 3) {
    hints.push("Close loop to create new annotation.");
  }
  if (this.points.length <= 5) {
    hints.push("Press 'z' to remove points.");
  }
  hints.push("Press 'esc' to quit.");

  $('#toolName').text(this.toolName);
  $('#toolMessage').text(hints[0]);
}

//
// Exports
//
window.newTool = newTool;
