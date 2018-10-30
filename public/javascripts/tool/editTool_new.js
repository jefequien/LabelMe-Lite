

var editTool = new Tool();
editTool.onMouseMove = function(event) {
  this.curser.position = event.point;
  this.snapCurser();

  if (this.points.length == 0) {

    // Path from boundary to curser
    var path = this.getPathToBoundary(this.curser.position);
    path.remove();
    this.bp0.position = path.firstSegment.point;
    this.line.segments = path.segments;

    this.bl.segments = [];
    this.bp1.visible = false;
  } else {
    // Path from last point to curser
    var lastPoint = this.points[this.points.length-1].position;
    var path = this.getPath(lastPoint, this.curser.position);
    path.remove();
    this.line.segments = path.segments;

    // Path from boundary crossing to bp0
    this.bl.segments = [];
    this.bp1.visible = false;

    var intersections = this.line.getIntersections(this.annotation.boundary);
    intersections.sort(function(a, b) { 
      a = lastPoint.getDistance(a.point);
      b = lastPoint.getDistance(b.point);
      return a - b;
    });

    for (var i = 0; i < intersections.length; i++) {
      var point = intersections[i].point;
      var bl = this.getPathUsingBoundary(point, this.bp0.position);
      if (bl != null) {
        bl.remove();
        this.bl.segments = bl.segments;
        this.bp1.position = point;
        this.bp1.visible = true;
        break;
      }
    }
  }
  this.enforceStyles();
}
editTool.onMouseDown = function(event) {
  this.onMouseMove(event);
  if (this.curser.intersects(this.points[0])) {
    if (this.points.length >= 2) {
      // Edit without using boundary
      this.segments.push(this.line.clone());
      this.segments.shift();
      this.editAnnotation(this.segments);
      editTool.switch(this.annotation);
    }
  } else if (this.bp1.visible) {
    // Edit using boundary
    var goodPart = this.line.clone();
    var badPart = goodPart.splitAt(goodPart.getLocationOf(this.bp1.position));
    badPart.remove();

    this.segments.push(goodPart);
    this.editAnnotation(this.segments, this.bl);
    editTool.switch(this.annotation);

    // Continue after editting annotation
    var p0 = this.annotation.boundary.getNearestPoint(badPart.firstSegment.point);
    var p1 = event.point;
    var line = new Path(p0, p1);
    line.remove();
    this.onMouseDown({point: line.getPointAt(1)});
    this.onMouseDown({point: p1});

  } else {
    this.points.push(this.curser.clone());
    this.segments.push(this.line.clone());
  }
}
editTool.onKeyDown = function(event) {
  onKeyDownShared(event);

  if (event.key == 'z') {
    var success = this.undo();
    if ( ! success) {
      selectTool.switch();
    }
  }
  if (event.key == 'u') {
    var success = this.annotation.undo();
    if (success) {
      editTool.switch(this.annotation);
    } else {
      selectTool.switch();
    }
  }
  else if (event.key == 'backspace') {
    // Undo. Then delete.
    var success = this.undo();
    if ( ! success) {
      this.annotation.delete();
      selectTool.switch();
    }
  }
  else if (event.key == 'c') {
    this.segments.push(this.line);
    this.cutAnnotation(this.segments);
    editTool.switch(this.annotation);
  }
  else if (event.key == 'space') {
    scissors.toggle();
  }
  else if (event.key == 'v') {
    scissors.toggleVisualize();
  }
}
editTool.deactivate = function() {
  this.curser.remove();
  this.line.remove();
  this.bp0.remove();
  this.bp1.remove();
  this.bl.remove();

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
  this.curser = new Shape.Circle(paper.tool.curser.position, 4);
  this.activate();

  this.annotation = annotation;
  if (background.lastFocus != this.annotation) {
    background.focus(this.annotation);
  }

  for (var i = 0; i < annotations.length; i++) {
    annotations[i].hide();
  }
  this.annotation.unhide();

  this.points = [];
  this.segments = [];
  this.line = new Path();
  this.bl = new Path();
  this.curser.bringToFront();
  this.bp0 = this.curser.clone();
  this.bp1 = this.curser.clone();

  this.refreshTool();
  this.interval = setInterval(this.refreshTool, 300);
  if (this.annotation.deleted) {
    selectTool.switch();
  }
}
editTool.refreshTool = function() {
  paper.tool.onMouseMove({point: paper.tool.curser.position});
}
editTool.editAnnotation = function(segments, bl) {
  // Join segments
  var allSegments = new Path();
  for (var i = 0; i < segments.length; i++) {
    allSegments.join(segments[i]);
  }

  var fullPath = allSegments.clone();
  if (bl) {
    fullPath.join(bl);
  }

  if (this.mode == "unite") {
    this.annotation.unite(fullPath);
  } else {
    this.annotation.subtract(fullPath);
    this.annotation.unitePath(allSegments);
  }

  this.annotation.updateBoundary();
  allSegments.remove();
  fullPath.remove();
}
editTool.cutAnnotation = function(segments) {
  // Join segments
  var path = new Path();
  for (var i = 0; i < segments.length; i++) {
    path.join(segments[i]);
  }

  var onePixel = this.annotation.raster.bounds.height / this.annotation.raster.height;
  this.annotation.subtractPath(path);
  path.translate(new Point(onePixel, 0));
  this.annotation.subtractPath(path);

  this.annotation.updateBoundary();
  path.remove();
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
  return success;
}
editTool.snapCurser = function() {
  // Snap to annotation bounds
  var ann_bounds = this.annotation.raster.bounds;
  if ( ! ann_bounds.contains(this.curser.position)) {
    var rect = new Path.Rectangle(ann_bounds);
    rect.remove();
    this.curser.position = rect.getNearestPoint(this.curser.position);
  }
  // Snap to first point
  if (this.points.length > 1) {
    if (this.curser.intersects(this.points[0])) {
      this.curser.position = this.points[0].position;
      this.segments[0].visible = false;
      this.bp0.visible = false;
    } else {
      this.segments[0].visible = true;
      this.bp0.visible = true;
    }
  }
}
editTool.enforceStyles = function() {
  // Curser and annotation styles
  if (this.mode == "unite") {
    this.curser.fillColor = "#00FF00";
  } else {
    this.curser.fillColor = "red";
  }
  if (this.annotation.boundary.contains(this.curser.position)) {
    this.annotation.highlight();
  } else {
    this.annotation.unhighlight();
  }
  this.annotation.boundary.strokeColor = "gold";
  this.annotation.boundary.strokeWidth = 3;

  // Other styles
  this.bp0.fillColor = "gold";
  this.bp0.strokeColor = "black";
  this.bp0.strokeWidth = 2;
  this.bp1.style = this.bp0.style;
  this.line.strokeColor = "black";
  this.line.strokeWidth = 3;
  this.bl.style = this.line.style;
  this.bl.dashArray = [10, 4];

  // Keep points the same size regardless of scaling.
  var r = 8 / (this.curser.bounds.height);
  this.curser.scale(r);
  this.bp0.scale(r);
  this.bp1.scale(r);
  for (var i = 0; i < this.points.length; i++) {
    this.points[i].scale(r);
    this.points[i].fillColor = this.curser.fillColor;
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
editTool.getPathToBoundary = function(end) {
  if ( ! scissors.active) {
    var start = this.annotation.boundary.getNearestPoint(end);
    if (start) {
      return new Path.Line(start, end);
    } else {
      return null;
    }

  } else {
    // Try pixels along line
    var path = new Path.Line(start, end);
    background.toPixelSpace(path);
    path.remove();

    for (var i = 0; i < path.length; i+=20) {
      var p1 = path.getPointAt(path.length-i);

      var pixelList = scissors.getPath(this.annotation.boundaryPixels, [p1.x, p1.y]);
      if (pixelList != null) {
        var newPath = new Path({"segments": pixelList})
        background.toPointSpace(newPath);

        // Smooth out path
        newPath.add(end);
        newPath.removeSegment(newPath.segments.length - 2);
        return newPath;
      }
    }
  }

}
editTool.getPathUsingBoundary = function(point0, point1) {
  var point0 = this.annotation.boundary.getNearestPoint(point0);
  var point1 = this.annotation.boundary.getNearestPoint(point1);

  var boundaries = this.annotation.boundary.children;
  for (var i = 0; i < boundaries.length; i++) {
    var path = boundaries[i].clone();
    path.remove();
    var p0 = path.getLocationOf(point0);
    var p1 = path.getLocationOf(point1);
    if (p0 != null && p1 != null) {
      path.splitAt(p0);
      var other = path.splitAt(p1);
      if (other) {
        other.reverse();
        other.remove();
      } else {
        // p0 == p1
        return new Path.Line(point0, point1);
      }

      // Return the shorter path
      path = (path.length < other.length) ? path : other;
      return new Path(path.pathData);
    }
  }
  return null;
}

window.editTool = editTool;