

var editTool = new Tool();
editTool.onMouseMove = function(event) {
  this.curser.position = event.point;
  this.snapCurser();

  if (this.points.length == 0) {
    // Get path from boundary to curser
    var path = this.getPathToBoundary(this.curser.position);
    path.remove();

    // Update objects
    this.bp0.position = path.firstSegment.point;
    this.dashedLine.segments = path.segments;
    this.line.segments = [];
    this.bl.segments = [];
    this.bp1.position = null;
  } else {
    // Get path from last point to curser
    var lastPoint = this.points[this.points.length-1].position;
    var path = this.getPath(lastPoint, this.curser.position);
    path.remove();

    // Update objects
    this.line.segments = path.segments;
    // Get path back to start along boundary
    this.bl.segments = [];
    this.bp1.position = null;

    var intersections = this.line.getIntersections(this.annotation.boundary);
    var closestDistance = Infinity;
    for (var i = 0; i < intersections.length; i++) {
      var point = intersections[i].point;
      var distance = point.getDistance(lastPoint);
      var bl = this.getPathUsingBoundary(point, this.bp0.position);
      if (bl != null) {
        bl.remove();
        if (distance < closestDistance) {
          this.bl.segments = bl.segments;
          this.bp1.position = point;
          var closestDistance = distance;
        }
      }
    }
  }

  this.setMode();
  this.enforceStyles();
}
editTool.onMouseUp = function(event) {
  if (this.isDragging) {
    this.isDragging = false;
    return;
  }

  if (this.curser.intersects(this.points[0])) {
    if (this.points.length >= 2) {
      // Edit without using boundary
      this.segments.push(this.line.clone());

      // Join segments
      var path = new Path();
      for (var i = 0; i < this.segments.length; i++) {
        path.join(this.segments[i]);
      }
      this.editAnnotation(path);

    }
  } else if (this.bp1.intersects(this.annotation.boundary)) {
    // Edit using boundary
    var goodPart = this.line.clone();
    var badPart = goodPart.splitAt(goodPart.getLocationOf(this.bp1.position));
    badPart.remove();
    this.segments.push(goodPart);
    this.segments.push(this.bl);
    this.segments.push(this.dashedLine);

    // Join segments
    var path = new Path();
    for (var i = 0; i < this.segments.length; i++) {
      path.join(this.segments[i]);
    }
    this.editAnnotation(path);

  } else {
    this.points.push(this.curser.clone());
    this.segments.push(this.line.clone());
  }
}
editTool.onMouseDrag = function(event) {
  background.move(event.delta);
  this.isDragging = true;
  this.refresh();
}
editTool.onKeyDown = function(event) {
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
    background.focus(this.annotation);
    return false;
  }

  // Escape keys
  if (event.key == 'escape') {
    // Undo. Then quit.
    var success = this.undo();
    if ( ! success) {
      selectTool.switch();
    }
    return false;
  }
  if (event.key == 'backspace') {
    // Undo. Then delete.
    var success = this.undo();
    if ( ! success) {
      this.annotation.delete();
      selectTool.switch();
    }
    return false;
  }
  if (event.key == 'q') {
    selectTool.switch();
    return false;
  }

  // Tool keys
  if (event.key == 'b') {
    brushTool.switch(this.annotation);
    return false;
  }
  if (event.key == 'space') {
    scissors.toggle();
    return false;
  }
}
editTool.deactivate = function() {
  this.curser.remove();
  this.line.remove();
  this.bp0.remove();
  this.bp1.remove();
  this.bl.remove();
  this.dashedLine.remove();

  for (var i = 0; i < this.points.length; i++) {
    this.points[i].remove();
  }
  for (var i = 0; i < this.segments.length; i++) {
    this.segments[i].remove();
  }

  clearInterval(this.interval);
}
editTool.switch = function(annotation) {
  this.toolName = "editTool";
  console.log("Switching to", this.toolName);
  paper.tool.deactivate();
  this.curser = new Shape.Circle(paper.tool.curser.position);
  this.activate();

  this.annotation = annotation;
  for (var i = 0; i < annotations.length; i++) {
    annotations[i].hide();
  }
  this.annotation.highlight();

  this.points = [];
  this.segments = [];
  this.line = new Path();
  this.bl = new Path();
  this.dashedLine = new Path(); // bp0 to points[0]
  this.bp0 = new Shape.Circle();
  this.bp1 = new Shape.Circle();

  this.refresh();
  this.interval = setInterval(this.refresh, 300);
}
editTool.refresh = function() {
  var fakeEvent = {point: editTool.curser.position};
  editTool.onMouseMove(fakeEvent);
}
editTool.editAnnotation = function(path) {
  if (this.mode == "unite") {
    this.annotation.unite(path);
  } else {
    this.annotation.subtract(path);
  }
  this.annotation.refresh();

  path.remove();
  editTool.switch(this.annotation);
}
editTool.undo = function() {
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
editTool.snapCurser = function() {
  // Snap to annotation bounds
  if ( ! this.annotation.raster.contains(this.curser.position)) {
    var bounds = new Path.Rectangle(this.annotation.raster.bounds);
    this.curser.position = bounds.getNearestPoint(this.curser.position);
    bounds.remove();
  }
  // Snap to first point
  if (this.curser.intersects(this.points[0])) {
    this.curser.position = this.points[0].position;
  }
}
editTool.enforceStyles = function() {
  var radius = 4;
  // Curser and annotation styles
  this.curser.radius = radius;
  if (this.mode == "unite") {
    this.curser.fillColor = "#00FF00";
    this.annotation.unhighlight();
  } else {
    this.curser.fillColor = "red";
    this.annotation.highlight();
  }
  this.annotation.boundary.strokeColor = "gold";
  this.annotation.boundary.strokeWidth = 3;

  // Other styles
  this.bp0.radius = radius;
  this.bp0.fillColor = "gold";
  this.bp0.strokeColor = "black";
  this.bp0.strokeWidth = 2;
  this.bp1.radius = radius;
  this.bp1.style = this.bp0.style;
  this.line.strokeColor = "black";
  this.line.strokeWidth = 3;
  this.bl.style = this.line.style;
  this.bl.dashArray = [10, 4];
  this.dashedLine.style = this.bl.style;

  // Toggle dashed line
  if (this.points.length >= 2 && this.curser.intersects(this.points[0])) {
      this.dashedLine.visible = false;
  } else {
    this.dashedLine.visible = true;
  }

  // Keep points the same size regardless of scaling.
  var r = radius / (this.curser.bounds.height/2);
  this.curser.scale(r);
  this.bp0.scale(r);
  this.bp1.scale(r);
  for (var i = 0; i < this.points.length; i++) {
    this.points[i].scale(r);
  }
}
editTool.setMode = function() {
  var modePoint = this.curser.position;
  if (this.points.length >= 1) {
    modePoint = this.points[0].position;
  }
  if ( ! this.annotation.boundary.contains(modePoint)) {
    this.mode = "unite";
  } else {
    this.mode = "subtract";
  }
}
editTool.getPath = function(start, end) {
  var path = new Path.Line(start, end);
  if (scissors.active) {
    var p0 = background.getPixel(start);
    var p1 = background.getPixel(end);

    var pixelList = scissors.getPath([p0.x, p0.y], [p1.x, p1.y]);
    if (pixelList != null) {
      path.segments = pixelList;
      background.toPointSpace(path);

      path.insert(0, start);
      path.add(end);
      // Smooth out path
      path.removeSegment(1);
      path.removeSegment(path.segments.length - 2);
    }
  }
  return path;
}
editTool.getPathToBoundary = function(point) {
  var path = new Path.Line(this.annotation.boundary.getNearestPoint(point), point);
  if (scissors.active) {
    var boundaryPixel = this.annotation.boundary.clone()
    background.toPixelSpace(boundaryPixel);
    boundaryPixel.remove();

    var pixels = [];
    for (var i = 0; i < boundaryPixel.children.length; i++) {
      var child = boundaryPixel.children[i];
      for (var j = 0; j < child.segments.length; j++) {
        var x = Math.round(child.segments[j].point.x);
        var y = Math.round(child.segments[j].point.y);
        pixels.push([x,y])
      }
    }

    var p = background.getPixel(point);
    var pixelList = scissors.getPath(pixels, [p.x, p.y]);
    if (pixelList != null) {
      path.segments = pixelList;
      background.toPointSpace(path);

      path.insert(0, this.annotation.boundary.getNearestPoint(path.firstSegment.point));
      path.add(point);
      // Smooth out path
      path.removeSegment(1);
      path.removeSegment(path.segments.length - 2);
    }
  }
  return path;
}
editTool.getPathUsingBoundary = function(point0, point1) {
  for (var i = 0; i < this.annotation.boundary.children.length; i++) {
    var boundary = this.annotation.boundary.children[i].clone();
    var p0 = boundary.getLocationOf(point0);
    var p1 = boundary.getLocationOf(point1);
    if (p0 != null && p1 != null) {
      // p0 and p1 are on boundary
      boundary.splitAt(p0);
      var other = boundary.splitAt(p1);
      if ( ! other) {
        // p0 and p1 were the same point
        boundary.remove();
        return new Path.Line(point0, point1);
      }

      // Return the shorter path
      var shorter = null;
      if (boundary.length < other.length) {
        shorter = new Path(boundary.pathData);
      } else {
        shorter = new Path(other.pathData);
        shorter.reverse();
      }
      boundary.remove();
      other.remove();
      return shorter;
    } else {
      boundary.remove();
    }
  }
  return null;
}

window.editTool = editTool;
