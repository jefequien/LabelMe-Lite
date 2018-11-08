

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
}
newTool.onMouseDown = function(event) {
  this.onMouseMove(event);
  this.points.push(this.curser.clone());
  this.segments.push(this.line.clone());

  if (this.curser.loopedBack) {
    this.createAnnotation();
  }
}
newTool.onMouseUp = function(event) {
  if (this.annotation) {
    selectTool.switch();
  }
}
newTool.onKeyDown = function(event) {
  if (event.key == 'z') {
    var undoed = this.undo();
    if (! undoed) {
      selectTool.switch();
    }
  }
  if (event.key == 't') {
    scissors.toggle();
    this.refreshTool();
  }
  if (event.key == 'space') {
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
  this.toolName = "newTool";
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

  this.curser.loopedBack = false;

  this.refreshTool();

  setTimeout(this.requestName(), 100);
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
newTool.undo = function() {
  var success = false;
  if (this.points.length > 0) {
    this.points.pop().remove();
    success = true;
  }
  if (this.segments.length > 0) {
    this.segments.pop().remove();
    success = true;
  }
  return success;
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
    this.curser.loopedBack = true;
  } else {
    this.curser.loopedBack = false;
  }
}
newTool.enforceStyles = function() {
  var pointHeight = this.toolSize * 3;
  var lineWidth = this.toolSize;

  // Annotation styles
  for (var i = 0; i < annotations.length; i++) {
    annotations[i].hide();
  }

  // Point styles
  this.curser.fillColor = "red";
  this.curser.scale(pointHeight / this.curser.bounds.height);
  for (var i = 0; i < this.points.length; i++) {
    this.points[i].scale(pointHeight / this.points[i].bounds.height);
  }
  
  // Visibility
  this.curser.visible = ! this.curser.loopedBack;
  for (var i = 0; i < this.points.length; i++) {
    this.points[i].visible = ! this.curser.loopedBack;
  }

  // Line styles
  this.line.strokeColor = "blue";
  this.line.strokeWidth = lineWidth;
}
newTool.requestName = function() {
  var name = prompt("Please enter object name.", "");
  if (name == null || name == "") {
    selectTool.switch();
  } else {
    newTool.name = name;
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

//
// Exports
//
window.newTool = newTool;
