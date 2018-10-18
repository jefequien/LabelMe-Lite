

var newTool = new Tool();
newTool.onMouseMove = function(event) {
  this.curser.position = event.point;
  this.snapCurser();

  if (this.points.length == 0) {
    this.line.segments = [];
  } else {
    var path = this.getPath(this.points[this.points.length-1].position, this.curser.position);
    this.line.segments = path.segments;
    path.remove();
  }
}
newTool.onMouseDown = function(event) {
  this.onMouseMove(event);

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
    this.segments.push(this.line.clone());
  }
  
  this.onMouseMove(event);
}
newTool.onKeyDown = function(event) {
  event.point = this.curser.position;
  if (event.key == 'escape') {
    selectTool.switch();
    return false;
  }
  if (event.key == 'backspace') {
    this.undo();
    this.onMouseMove(event);
    return false;
  }
}
newTool.createAnnotation = function(path) {
  var mask = nj.zeros([background.image.height, background.image.width]);
  var annotation = new Annotation(mask, this.name);
  background.align(annotation);

  annotation.unite(path);
  annotation.updateBoundary();
  annotation.unhighlight();

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
  return success;
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
}
newTool.switch = function () {
  paper.tool.deactivate();
  console.log("Switching to newTool");

  // Prompt for object name.
  this.name = this.requestName();
  if (this.name == null) {
    selectTool.switch();
    return;
  }

  this.curser = new Shape.Circle({
    radius: 5,
    strokeColor: 'red',
    strokeWidth: 3
  });
  this.line = new Path();
  this.points = [];
  this.segments = [];

  // Styles
  this.line.strokeWidth = 3;
  this.line.strokeColor = 'blue';

  this.activate();
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
newTool.requestName = function() {
  var name = prompt("Please enter object name.", "");
  if (name == null || name == "") {
    return null;
  } else {
    return name;
  }
}
newTool.getPath = function(start, end) {
  var path = new Path.Line(start, end);
  if (scissors.active) {
    var p0 = background.getPixel(start);
    var p1 = background.getPixel(end);
    var pixelList = scissors.getPath([p0.x, p0.y], [p1.x, p1.y]);
    if (pixelList != null) {
      path.segments = pixelList;
      background.toPointSpace(path);
      // Edit start and end of path to fit better
      path.segments.shift();
      path.segments.pop();
      path.insert(0, start);
      path.add(end);
    }
  }
  return path;
}

window.newTool = newTool;
