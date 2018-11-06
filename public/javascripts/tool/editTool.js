

var editTool = new Tool();

editTool.onMouseMove = function(event) {
  this.curser.position = event.point;
  this.snapCurser();

  // Set this.selectedBoundary
  if ( ! this.selectedBoundary.fixed) {
    this.selectedBoundary.segments = [];
    this.selectedBoundaryPixels = [];
    for (var i = 0; i < this.annotation.boundary.children.length; i++) {
      var child = this.annotation.boundary.children[i];
      if (child.contains(this.curser.position)) {
        if (Math.abs(child.area) < Math.abs(this.selectedBoundary.area) || this.selectedBoundary.segments.length == 0) {
          this.selectedBoundary.segments = child.segments;
        }
      }
    }
  }

  // Set this.bp0 and this.line
  if (this.points.length == 0) {
    var path = this.getPathToBoundary(this.curser.position, this.selectedBoundary);
    path.remove();
    this.bp0.position = path.firstSegment.point;
    this.line.segments = path.segments;
  } else {
    var lastPoint = this.points[this.points.length-1].position;
    var path = this.getPath(lastPoint, this.curser.position);
    path.remove();
    this.line.segments = path.segments;
  }

  // Set this.segments
  if (this.segments.length >= 1){
    var path = this.getPathToBoundary(this.points[0].position, this.selectedBoundary);
    path.remove();
    this.segments[0].segments = path.segments;
  }
  for (var i = 1; i < this.segments.length; i++) {
    var p0 = (i == 0) ? this.bp0.position : this.points[i-1].position;
    var p1 = this.points[i].position;
    var path = this.getPath(p0, p1);
    path.remove();
    this.segments[i].segments = path.segments;
  }

  // Set this.bp1
  var intersections = this.line.getIntersections(this.selectedBoundary);
  intersections.sort(function(a, b) {
    a = lastPoint.getDistance(a.point);
    b = lastPoint.getDistance(b.point);
    return a - b;
  });
  this.bp1.isSet = false;
  for (var i = 0; i < intersections.length; i++) {
    var d = this.line.getLocationOf(intersections[i].point).offset;
    if (d != 0) {
      this.bp1.position = intersections[i].point;
      this.bp1.isSet = true;
      break;
    }
  }
  if ( ! this.bp1.isSet) {
    this.bp1.position = this.selectedBoundary.getNearestPoint(this.curser.position);
    if (this.selectedBoundary.segments.length == 0) {
      this.bp1.position = this.bp0.position;
    }
  }

  // Set this.bl
  var path = this.getPathUsingBoundary(this.bp1.position, this.bp0.position, this.selectedBoundary);
  path.remove();
  this.bl.segments = path.segments;

  // Set this.selectedArea
  this.selectedArea.segments = [];
  for (var i = 0; i < this.segments.length; i++) {
    this.selectedArea.join(this.segments[i].clone());
  }
  if (this.bp1.intersects(this.line)) {
    var goodPart = this.line.clone();
    var badPart = goodPart.splitAt(goodPart.getLocationOf(this.bp1.position));
    if (badPart) {
      badPart.remove();
    }
    this.selectedArea.join(goodPart);
  } else {
    this.selectedArea.join(this.line.clone());
    this.selectedArea.add(this.bp1.position);
  }
  this.selectedArea.join(this.bl.clone());

  this.setMode();
  this.enforceStyles();
}
editTool.onMouseDown = function(event) {
  this.onMouseMove(event);
  if ( ! this.selectedBoundary.fixed) {
    if (this.selectedBoundary.segments.length != 0) {
      this.selectedBoundary.fixed = true;
      this.selectedBoundaryPixels = [];
      var pixels = background.getBoundaryPixels(this.selectedBoundary);
      for (var i = 0; i < pixels.length; i++) {
        this.selectedBoundaryPixels.push([pixels[i].x, pixels[i].y]);
      }
    }
  }
  else {
    this.points.push(this.curser.clone());
    this.segments.push(this.line.clone());
  }

  // Edit
  if (this.bp1.isSet) {
    this.editAnnotation();
    editTool.switch(this.annotation);

  } else if (this.curser.loopedBack) {
    this.selectedArea.segments = [];
    for (var i = 1; i < this.segments.length; i++) {
      this.selectedArea.join(this.segments[i].clone());
    }

    this.editAnnotation();
    editTool.switch(this.annotation);
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
  else if (event.key == 'u') {
    this.annotation.undo();
    editTool.switch(this.annotation);
  }
  else if (event.key == 'backspace') {
    if (this.selectedBoundary.fixed) {
      this.deleteSelectedBoundary();
      editTool.switch(this.annotation);
    } else {
      this.annotation.delete();
      selectTool.switch();
    }
  }
  else if (event.key == 'c') {
    this.cutAnnotation();
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
  this.button.className = this.button.className.replace(" active", "");

  this.curser.remove();
  this.bp0.remove();
  this.bp1.remove();
  this.line.remove();
  this.bl.remove();
  this.selectedBoundary.remove();
  this.selectedArea.remove();

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
  var lastCurserPosition = paper.tool.curser.position;
  if (annotation == null) {
    alert(this.toolName + ": Please select an annotation to edit first.");
    selectTool.switch();
    return;
  }
  paper.tool.deactivate();
  this.activate();

  this.button = editToolButton;
  this.button.className += " active";
  this.curser = new Shape.Circle(lastCurserPosition, 1);

  this.annotation = annotation;
  for (var i = 0; i < annotations.length; i++) {
    annotations[i].hide();
  }

  this.points = [];
  this.segments = [];
  this.bp0 = this.curser.clone();
  this.bp1 = this.curser.clone();
  this.line = new Path();
  this.bl = new Path();
  this.selectedBoundary = new Path({closed: true});
  this.selectedBoundaryPixels = [];
  this.selectedArea = new Path();

  this.selectedBoundary.fixed = false;
  this.curser.loopedBack = false;

  this.refreshTool();
  this.interval = setInterval(this.refreshTool, 300);
}
editTool.refreshTool = function() {
  paper.tool.onMouseMove({point: paper.tool.curser.position});
}

//
// Edit Actions
//
editTool.editAnnotation = function() {
  if (this.mode == "unite") {
    this.annotation.unite(this.selectedArea);
  } else {
    this.annotation.subtract(this.selectedArea);

    // Keep edge pixels
    var pixels = background.getBoundaryPixels(this.selectedArea);
    var edgePixels = [];
    for (var i = 0; i < pixels.length; i++) {
      var point = background.getPoint(pixels[i]);
      if (this.annotation.boundary.contains(point)) {
        edgePixels.push(pixels[i]);
      }
    }
    this.annotation.unitePixels(edgePixels);
    this.annotation.subtractPath(this.bl);
  }

  this.annotation.updateBoundary();
  this.refreshTool();
}
editTool.deleteSelectedBoundary = function() {
  if (this.selectedBoundary.clockwise == this.annotation.boundary.clockwise) {
    this.annotation.subtract(this.selectedBoundary);
  } else {
    this.annotation.unite(this.selectedBoundary);
  }

  this.selectedBoundary.fixed = false;
  this.annotation.updateBoundary();
  this.refreshTool();
}
editTool.cutAnnotation = function() {
  var path = new Path();
  for (var i = 0; i < this.segments.length; i++) {
    path.join(this.segments[i].clone());
  }
  path.join(this.line.clone());
  path.remove();

  this.annotation.subtractPath(path);
  var delta = new Point(background.getPixelHeight(), 0);
  path.translate(delta);
  this.annotation.subtractPath(path);

  this.annotation.updateBoundary();
  this.refreshTool();
}
editTool.undo = function() {
  if (this.points.length > 0) {
    this.points.pop().remove();
    this.segments.pop().remove();
    this.refreshTool();
    return true;
  } else if (this.selectedBoundary.fixed) {
    this.selectedBoundary.fixed = false;
    this.refreshTool();
    return true;
  }
  return false;
}

// 
// Styles
//
editTool.snapCurser = function() {
  // Snap to annotation bounds
  var ann_bounds = this.annotation.raster.bounds;
  if ( ! ann_bounds.contains(this.curser.position)) {
    var rect = new Path.Rectangle(ann_bounds);
    rect.remove();
    this.curser.position = rect.getNearestPoint(this.curser.position);
  }
  // Snap to first point
  if (this.points.length >= 2 && this.curser.intersects(this.points[0])) {
    this.curser.position = this.points[0].position;
    this.curser.loopedBack = true;
  } else {
    this.curser.loopedBack = false;
  }
}
editTool.setMode = function() {
  var modePoint = null;
  if (this.segments.length == 0) {
    modePoint = this.line.getPointAt(1);
  } else {
    modePoint = this.segments[0].getPointAt(1);
  }
  if ( ! this.annotation.boundary.contains(modePoint)) {
    this.mode = "unite";
  } else {
    this.mode = "subtract";
  }
}
editTool.enforceStyles = function() {
  // Point styles
  var r = 8;
  var strokeWidth = 3;

  var allPoints = this.points.concat([this.bp0, this.bp1, this.curser]);
  for (var i = 0; i < allPoints.length; i++) {
    var p = allPoints[i];
    p.scale(r / p.bounds.height);
    if (this.mode == "unite") {
      p.fillColor = "#00FF00";
    } else {
      p.fillColor = "red";
    }
  }
  this.bp0.fillColor = "gold";
  this.bp0.strokeColor = "black";
  this.bp0.strokeWidth = 0.5;
  this.bp1.style = this.bp0.style;

  this.bp0.visible = this.selectedBoundary.fixed;
  this.line.visible = this.selectedBoundary.fixed;
  this.curser.visible = this.selectedBoundary.fixed;
  this.bp1.visible = this.bp1.isSet;
  if (this.segments.length > 0) {
    this.segments[0].visible = ! this.curser.loopedBack;
    this.bp0.visible = ! this.curser.loopedBack;
  }

  this.annotation.highlight();
  this.selectedBoundary.strokeColor = "gold";
  this.selectedBoundary.strokeWidth = 3;

  // Other styles
  this.line.strokeColor = "black";
  this.line.strokeWidth = 3;

  this.bl.strokeColor = "black";
  this.bl.strokeWidth = 3;
  this.bl.dashArray = [10, 4];

  for (var i = 0; i < this.segments.length; i++) {
    this.segments[i].strokeColor = "black";
    this.segments[i].strokeWidth = 3;
  }

  // this.selectedArea
  this.selectedArea.opacity = 0.3;
  if (this.mode == "unite") {
    this.selectedArea.fillColor = "#00FF00";
  } else {
    this.selectedArea.fillColor = "red";
  }

  this.selectedBoundary.bringToFront();
  this.selectedArea.bringToFront();
  this.bl.bringToFront();
  this.bp0.bringToFront();
  this.bp1.bringToFront();
  this.curser.bringToFront();
}

//
// Path finding functions
//
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
editTool.getPathToBoundary = function(point, boundary) {
  if (scissors.active) {
    // Try pixels along line
    var start = boundary.getNearestPoint(point);
    var path = new Path.Line(start, point);
    background.toPixelSpace(path);
    path.remove();

    for (var i = 0; i < path.length; i+=20) {
      var p1 = path.getPointAt(path.length-i);
      if (this.selectedBoundaryPixels.length == 0) {
        break;
      } 

      var pixelList = scissors.getPath(this.selectedBoundaryPixels, [p1.x, p1.y]);
      if (pixelList != null) {
        var newPath = new Path({"segments": pixelList})
        background.toPointSpace(newPath);

        // Smooth out path
        newPath.add(point);
        newPath.removeSegment(newPath.segments.length - 2);
        return newPath;
      }
    }
  }

  var start = boundary.getNearestPoint(point);
  if (start) {
    return new Path.Line(start, point);
  } else {
    return new Path.Line(point, point);
  }
}
editTool.getPathUsingBoundary = function(point0, point1, boundary) {
  var point0 = boundary.getNearestPoint(point0);
  var point1 = boundary.getNearestPoint(point1);
  var path = boundary.clone();

  var p0 = path.getLocationOf(point0);
  var p1 = path.getLocationOf(point1);
  path.splitAt(p0);
  var other = path.splitAt(p1);
  if (other) {
    other.reverse();
    if (path.length < other.length) {
      other.remove();
      return path;
    } else {
      path.remove();
      return other;
    }
  } else {
    path.remove();
    return new Path(point0, point1);
  }
}

//
// Exports
//
window.editTool = editTool;
