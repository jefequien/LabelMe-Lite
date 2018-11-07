

var newTool = new Tool();
newTool.onMouseMove = function(event) {
  this.curser.position = event.point;
  this.snapCurser();
  this.enforceStyles();

  if (this.points.length == 0) {
    this.line.segments = [];
  } else {
    var path = this.getPath(this.points[this.points.length-1].position, this.curser.position);
    path.remove();
    this.line.segments = path.segments;
  }
}
newTool.onMouseDown = function(event) {
  this.onMouseMove(event);
  if (this.curser.intersects(this.points[0])) {
    if (this.points.length >= 2) {
    // Create new annotation
      this.segments.push(this.line.clone());
      this.createAnnotation();
    }

  } else {
    this.points.push(this.curser.clone());
    if (this.points.length > 1) {
      this.segments.push(this.line.clone());
    }
  }
}
newTool.onMouseUp = function(event) {
  if (this.annotation) {
    selectTool.switch();
  }
}
newTool.onKeyDown = function(event) {
  if (event.key == 'z') {
    // Undo. Then, quit.
    var success = this.undo();
    if (! success) {
      selectTool.switch();
    }
  }
  if (event.key == 'space') {
    scissors.toggle();
  }
  if (event.key == 'v') {
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

  this.line = new Path();
  this.points = [];
  this.segments = [];

  this.refreshTool();
  this.interval = setInterval(this.refreshTool, 300);

  this.requestName();
}
newTool.refreshTool = function() {
  newTool.onMouseMove({point: newTool.curser.position});
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
    this.curser.visible = false;
    for (var i = 0; i < this.points.length; i++) {
      this.points[i].visible = false;
    }
  } else {
    this.curser.visible = true;
    for (var i = 0; i < this.points.length; i++) {
      this.points[i].visible = true;
    }
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

  // Line styles
  this.line.strokeColor = "blue";
  this.line.strokeWidth = lineWidth;
}
newTool.requestName = function() {
  this.name = prompt("Please enter object name.", "");
  if (this.name == null || this.name == "") {
    selectTool.switch();
  }
}

//
// Path finding functions
//
newTool.getPath = function(start, end) {
  if ( ! scissors.active) {
    var path = new Path.Line(start, end);
    return path;
  } else {
    // Try pixels along line
    var path = new Path.Line(start, end);
    path.remove();
    background.toPixelSpace(path);

    for (var i = 0; i < path.length; i+=20) {
      var p0 = path.firstSegment.point;
      var p1 = path.getPointAt(path.length-i);

      var pixelList = scissors.getPath([p0.x, p0.y], [p1.x, p1.y]);
      if (pixelList != null) {
        var newPath = new Path({"segments": pixelList})
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
}

//
// Exports
//
window.newTool = newTool;
