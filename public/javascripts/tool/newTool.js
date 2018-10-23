

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
newTool.onMouseUp = function(event) {
  if (this.isDragging) {
    this.isDragging = false;
    return;
  }

  if (this.curser.intersects(this.points[0])) {
    if (this.points.length >= 2) {
    // Create new annotation
      this.segments.push(this.line.clone());

      // Join segments to form one path
      var path = new Path();
      for (var i = 0; i < this.segments.length; i++) {
        path.join(this.segments[i]);
      }
      this.createAnnotation(path);
    }

  } else {
    this.points.push(this.curser.clone());
    if (this.points.length > 1) {
      this.segments.push(this.line.clone());
    }
  }
}
newTool.onMouseDrag = function(event) {
  background.move(event.delta);
  this.isDragging = true;
}
newTool.onKeyDown = function(event) {
  // Zoom keys
  if (event.key == '9') {
    zoomOut();
    return false;
  }
  if (event.key == '0') {
    zoomIn();
    return false;
  }
  if (event.key == 'f') {
    background.focus();
    return false;
  }
  
  // Escape keys
  if (event.key == 'escape' || event.key == 'backspace') {
    // Undo. If cannot undo, quit.
    var success = this.undo();
    if (! success) {
      selectTool.switch();
    }
    return false;
  }
  if (event.key == 'q') {
    selectTool.switch();
    return false;
  }

  // Tool keys
  if (event.key == 'space') {
    scissors.toggle();
    return false;
  }
  if (event.key == 'v') {
    scissors.toggleVisualize();
    return false;
  }
}
newTool.deactivate = function() {
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
  paper.tool.deactivate();
  this.curser = new Shape.Circle(paper.tool.curser.position);
  this.activate();

  for (var i = 0; i < annotations.length; i++) {
    annotations[i].hide();
  }

  this.line = new Path();
  this.points = [];
  this.segments = [];
  this.enforceStyles();

  this.requestName();
  this.refresh();
  this.interval = setInterval(this.refresh, 300);
}
newTool.refresh = function() {
  var fakeEvent = {point: newTool.curser.position};
  newTool.onMouseMove(fakeEvent);
}
newTool.createAnnotation = function(path) {
  var annotation = new Annotation(this.name);
  annotation.unite(path);
  annotation.refresh();

  path.remove();
  selectTool.switch();
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
  this.refresh();
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
  var radius = 4;
  this.curser.radius = radius;
  this.curser.fillColor = "red";

  this.line.strokeColor = 'blue';
  this.line.strokeWidth = 3;

  // Keep points at the same size.
  var r = radius / (this.curser.bounds.height/2);
  this.curser.scale(r);
  for (var i = 0; i < this.points.length; i++) {
    this.points[i].scale(r);
  }
}
newTool.requestName = function() {
  this.name = prompt("Please enter object name.", "");
  if (this.name == null || this.name == "") {
    selectTool.switch();
  }
}
newTool.getPath = function(start, end) {
  if (scissors.active) {

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

  // Default
  var path = new Path.Line(start, end);
  return path;
}

window.newTool = newTool;
