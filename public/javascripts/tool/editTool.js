

var editTool = new Tool();

editTool.onMouseMove = function(event) {
  this.curser.position = event.point;
  this.snapCurser();

  // Set this.annotation
  if ( ! this.annotationFixed) {
    this.annotation = selectTool.getAnnotationAt(this.curser.position);
  }

  this.drawSegments();
  this.drawBoundaryPoints();
  if ( ! this.invertedMode) {
    this.drawSelectedArea();
  } else {
    this.drawSelectedAreaWithoutBoundary();
  }

  this.enforceStyles();
  this.writeHints();
}
editTool.onMouseClick = function(event) {
  this.onMouseMove(event);
  if (this.annotationFixed) {
    this.points.push(this.curser.clone());
  }
  if (this.annotation) {
    this.annotationFixed = true;
  }
  // if (this.points.length == 2) {
  //   this.editAnnotation();
  //   editTool.switch(this.annotation);
  //   editTool.onMouseClick(event);
  // }
  this.refreshTool();
}
editTool.onMouseDown = function(event) {
  this.dragDelta = 0;
}
editTool.onMouseDrag = function(event) {
  background.move(event.delta);
  this.dragDelta += event.delta.length;
  if (this.dragDelta > 15) {
    this.isDragging = true;
  }
}
editTool.onMouseUp = function(event) {
  if ( ! this.isDragging) {
    this.onMouseClick(event);
  }
  this.isDragging = false;
}
editTool.onKeyDown = function(event) {
  if (event.key == 'space') {
    brushTool.switch(this.annotation);
    return; // Prevent default
  }
  else if (event.key == 'enter') {
    this.editAnnotation();
    editTool.switch(this.annotation);
  }
  else if (event.key == 'i') {
    this.invertedMode = ! this.invertedMode;
    this.refreshTool();
  }
  else if (event.key == 'k') {
    this.cutAnnotation();
    editTool.switch(this.annotation);
  }

  // else if (event.key == 'n') {
  //   var success = this.splitAnnotation();
  //   if (success) {
  //     this.annotation.delete();
  //     selectTool.switch();
  //   }
  //   return; // Prevent default
  // }

  // Smart tool
  if (event.key == 't') {
    scissors.toggle();
    this.refreshTool();
  }
  else if (event.key == 'g') {
    scissors.toggleVisualize();
  }
  onKeyDownShared(event);
}
editTool.deactivate = function() {
  this.button.className = this.button.className.replace(" active", "");

  this.curser.remove();
  this.bp0.remove();
  this.bp1.remove();
  this.bl.remove();
  this.selectedArea.remove();
  this.selectedAreaUnite.remove();
  this.selectedAreaSubtract.remove();

  for (var i = 0; i < this.points.length; i++) {
    this.points[i].remove();
  }
  for (var i = 0; i < this.segments.length; i++) {
    this.segments[i].remove();
  }
  clearInterval(this.interval);
  this.interval = null;
}
editTool.switch = function(annotation) {
  this.toolName = "Edit Tool";
  console.log("Switching to", this.toolName);
  var lastCurserPosition = paper.tool.curser.position;
  var lastToolSize = paper.tool.toolSize;
  paper.tool.deactivate();
  this.activate();

  this.button = editToolButton;
  this.button.className += " active";
  this.curser = new Shape.Circle(lastCurserPosition, 1);
  this.toolSize = lastToolSize;
  this.annotation = annotation;

  this.points = [];
  this.segments = [];
  this.bp0 = this.curser.clone();
  this.bp1 = this.curser.clone();
  this.bl = new Path();
  this.selectedArea = new Path({closed: true});
  this.selectedAreaUnite = new Path({closed: true});
  this.selectedAreaSubtract = new Path({closed: true});

  this.annotationFixed = (this.annotation != null);
  this.invertedMode = false;

  this.refreshTool();
}
editTool.refreshTool = function() {
  paper.tool.onMouseMove({point: paper.tool.curser.position});
  if (scissors.active) {
    if (editTool.interval == null) {
      editTool.interval = setInterval(editTool.refreshTool, 300);
    }
  } else {
    clearInterval(editTool.interval);
    editTool.interval = null;
  }
}
editTool.undoTool = function() {
  if (this.points.length > 0) {
    this.points.pop().remove();
    this.refreshTool();
    return true;
  }
  return false;
}

//
// Draw
//
editTool.drawSegments = function() {
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
editTool.drawSegmentsComplex = function() {
  // Clear this.segments
  for (var i = 0; i < this.segments.length; i++) {
    this.segments[i].remove();
  }
  this.segments = [];

  // Set this.segments
  var allPoints = [];
  for (var i = 0; i < this.points.length; i++) {
    allPoints.push(this.points[i].position);
  }

  if (this.points.length > 0) {
    var forward = allPoints[0];
    var backward = allPoints[0];
    var forward_preference = 1;
    var backward_preference = 3;
    while (allPoints.length > 0) {
      var point = allPoints.shift();
      var forward_dist = point.getDistance(forward);
      var backward_dist = point.getDistance(backward);
      if (forward_dist * forward_preference < backward_dist * backward_preference) {
        var path = new Path(forward, point);
        this.segments.push(path);
        forward = point;
        forward_preference = 1;
        backward_preference = 3;
      } else {
        var path = new Path(point, backward);
        this.segments.unshift(path);
        backward = point;
        forward_preference = 3;
        backward_preference = 1;
      }
    }

    // Handle curser
    var point = this.curser.position;
    var forward_dist = point.getDistance(forward);
    var backward_dist = point.getDistance(backward);
    if (forward_dist * forward_preference < backward_dist * backward_preference) {
      var path = new Path(forward, point);
      var intersections = path.getIntersections(this.annotation.boundary);
      if (intersections.length > 0) {
        path.remove();
        intersections.sort(function(a, b) {
          a = forward.getDistance(a.point);
          b = forward.getDistance(b.point);
          return a - b;
        });
        path = new Path(forward, intersections[intersections.length-1].point);
      }
      this.segments.push(path);
    } else {
      var path = new Path(point, backward);
      var intersections = path.getIntersections(this.annotation.boundary);
      if (intersections.length > 0) {
        path.remove();
        intersections.sort(function(a, b) {
          a = backward.getDistance(a.point);
          b = backward.getDistance(b.point);
          return a - b;
        });
        path = new Path(intersections[intersections.length-1].point, backward);
      }
      this.segments.unshift(path);
    }
  }
}
editTool.drawBoundaryPoints = function() {
  // Set this.selectedSegment
  if (this.points.length > 0) {
    var point = this.points[0].position;
    point = this.annotation.boundary.getNearestPoint(point);
    for (var i = 0; i < this.annotation.boundary.children.length; i++) {
      var child = this.annotation.boundary.children[i];
      if (child.getLocationOf(point)) {
        this.selectedSegment = child;
      }
    }
  }

  // Set this.bp0
  this.bp0.position = this.curser.position;
  if (this.segments.length > 0) {
    var point = this.segments[0].firstSegment.point;
    this.bp0.position = this.selectedSegment.getNearestPoint(point);
  }

  // Set this.bp1
  this.bp1.position = this.curser.position;
  if (this.segments.length > 0) {
    var lastSegment = this.segments[this.segments.length-1];
    this.bp1.position = this.selectedSegment.getNearestPoint(lastSegment.lastSegment.point);
  }
}

editTool.drawSelectedArea = function() {
  this.bl.segments = [];
  this.selectedArea.remove();
  this.selectedAreaUnite.remove();
  this.selectedAreaSubtract.remove();

  // Set this.bl and this.selectedArea
  var paths = [];
  if (this.selectedSegment) {
    paths = this.getPathUsingBoundary(this.bp1.position, this.bp0.position, this.selectedSegment);
  }
  if (paths.length == 0) {
    paths.push(new Path(this.bp1.position, this.bp0.position))
    paths.push(new Path(this.bp0.position, this.bp1.position));
  }

  var selectedArea0 = this.makeSelectedArea(paths[0]);
  var selectedArea1 = this.makeSelectedArea(paths[1]);
  var area0 = Math.abs(selectedArea0.area);
  var area1 = Math.abs(selectedArea1.area);
  if (area0 < area1) {
    this.bl.segments = paths[0].segments;
    this.selectedArea = selectedArea0;
    selectedArea1.remove();
  } else {
    this.bl.segments = paths[1].segments;
    this.selectedArea = selectedArea1;
    selectedArea0.remove();
  }
  paths[0].remove();
  paths[1].remove();

  if (this.annotation) {
    this.selectedAreaUnite = this.selectedArea.subtract(this.annotation.boundary);
    this.selectedAreaSubtract = this.selectedArea.intersect(this.annotation.boundary);
  }
}
editTool.drawSelectedAreaWithoutBoundary = function() {
  this.bl.segments = [];
  this.selectedArea.remove();
  this.selectedAreaUnite.remove();
  this.selectedAreaSubtract.remove();

  // Set this.bl and this.selectedArea
  var selectedArea = this.makeSelectedArea();
  var selectedAreaUnite = selectedArea.subtract(this.annotation.boundary);
  var selectedAreaSubtract = selectedArea.intersect(this.annotation.boundary);

  this.selectedArea = selectedArea;
  if (Math.abs(selectedAreaUnite.area) != 0) {
    this.selectedAreaUnite = selectedArea;
    this.selectedAreaSubtract = new Path();
  } else {
    this.selectedAreaUnite = new Path();
    this.selectedAreaSubtract = selectedArea;
  }
}

editTool.makeSelectedArea = function(boundary) {
  var selectedArea = new Path();
  for (var i = 0; i < this.segments.length; i++) {
    selectedArea.join(this.segments[i].clone());
  }
  if (boundary) {
    selectedArea.join(boundary.clone());
  }
  selectedArea.closed = true;
  return selectedArea;
}

//
// Edit Actions
//
editTool.editAnnotation = function() {
  this.annotation.unite(this.selectedAreaUnite);
  this.annotation.subtract(this.selectedAreaSubtract);
  for (var i = 0; i < this.segments.length; i++) {
    this.annotation.unitePath(this.segments[i]);
  }

  this.annotation.updateBoundary();
  this.refreshTool();
}
// editTool.deleteSelectedBoundary = function() {
//   if (this.selectedBoundary.clockwise == this.annotation.boundary.clockwise) {
//     this.annotation.subtract(this.selectedBoundary);
//   } else {
//     this.annotation.unite(this.selectedBoundary);
//   }

//   this.selectedBoundaryFixed = false;
//   this.annotation.updateBoundary();
//   this.refreshTool();
// }
// editTool.splitAnnotation = function() {
//   var num = this.annotation.boundary.children.length;
//   if (num <= 1) {
//     alert("Nothing to split.");
//     return false;
//   }

//   if (confirm("Do you want to split this annotation into " + num +" annotations?")) {
//     for (var i = 0; i < num; i++) {
//       var newAnnotation = new Annotation(this.annotation.name);
//       newAnnotation.unite(this.annotation.boundary.children[i]);
//       newAnnotation.updateBoundary();
//     }
//     return true;
//   } else {
//     return false;
//   }
// }
editTool.cutAnnotation = function() {
  var delta = new Point(background.getPixelHeight() / 2, 0);
  for (var i = 0; i < this.segments.length; i++) {
    this.annotation.subtractPath(this.segments[i]);
    this.segments[i].translate(delta);
    this.annotation.subtractPath(this.segments[i]);
    this.segments[i].translate(-delta);
  }
  this.annotation.updateBoundary();
  this.refreshTool();
}

// 
// Styles
//
editTool.snapCurser = function() {
  // Snap to image bounds
  if ( ! background.image.contains(this.curser.position)) {
    var rect = new Path.Rectangle(background.image.bounds);
    rect.remove();
    this.curser.position = rect.getNearestPoint(this.curser.position);
  }
}
editTool.enforceStyles = function() {
  var pointHeight = this.toolSize * 1.5;
  var lineWidth = this.toolSize * 0.8;

  // this.annotation styles
  if (this.annotation) {
    this.annotation.highlight();
    this.annotation.raster.opacity = 0.2;
    this.annotation.boundary.strokeWidth = lineWidth * 1.5;
    this.annotation.boundary.strokeColor = "gold";
  }

  // Other annotations styles
  for (var i = 0; i < annotations.length; i++) {
    if (annotations[i] != this.annotation) {
      if (this.annotation) {
        annotations[i].hide();
      } else {
        annotations[i].unhighlight();
      }
    }
  }

  // Point styles
  var allPoints = this.points.concat([this.bp0, this.bp1, this.curser]);
  for (var i = 0; i < allPoints.length; i++) {
    var point = allPoints[i];
    point.scale(pointHeight / point.bounds.height);
    point.fillColor = "#00FF00";
    if (this.annotation && this.annotation.boundary.contains(point.position)) {
      point.fillColor = "red";
    }
  }
  this.bp0.fillColor = "gold";
  this.bp0.strokeColor = "black";
  this.bp0.strokeWidth = 0.5;
  this.bp1.style = this.bp0.style;

  // Line styles
  this.bl.strokeColor = "black";
  this.bl.strokeWidth = lineWidth;
  this.bl.dashArray = [10, 4];
  for (var i = 0; i < this.segments.length; i++) {
    this.segments[i].strokeColor = "black";
    this.segments[i].strokeWidth = lineWidth;
  }

  // this.selectedArea
  this.selectedArea.opacity = 0.1;
  this.selectedAreaUnite.opacity = 0.3;
  this.selectedAreaSubtract.opacity = 0.3;
  this.selectedArea.fillColor = "blue";
  this.selectedAreaUnite.fillColor = "#00FF00";
  this.selectedAreaSubtract.fillColor = "red";

  // Order
  this.selectedArea.bringToFront();
  this.bl.bringToFront();
  this.bp0.bringToFront();
  this.bp1.bringToFront();
  this.curser.bringToFront();

  // Visibility
  this.bl.visible = ! this.invertedMode;
  this.bp0.visible = ! this.invertedMode;
  this.bp1.visible = ! this.invertedMode;
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
    // Get boundary pixels
    if ( ! this.pixelCache) {
      this.pixelCache = {};
    }
    var b = boundary.clone();
    b.remove();
    background.toPixelSpace(b);
    var boundaryPixels = this.pixelCache[b.pathData];
    if ( ! boundaryPixels) {
      var pixels = background.getBoundaryPixels(boundary);
      for (var i = 0; i < pixels.length; i++) {
        boundaryPixels.push([pixels[i].x, pixels[i].y]);
      }
      this.pixelCache[b.pathData] = boundaryPixels;
    }

    // Try pixels along line
    var start = boundary.getNearestPoint(point);
    var path = new Path.Line(start, point);
    background.toPixelSpace(path);
    path.remove();

    for (var i = 0; i < path.length; i+=20) {
      var p1 = path.getPointAt(path.length-i);

      var pixelList = scissors.getPath(boundaryPixels, [p1.x, p1.y]);
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
  if (other == null) {
    // No path using boundary
    path.remove();
    return [];
  }
  other.reverse();
  return [path, other];
}

editTool.writeHints = function() {
  var hints = [];
  if ( ! this.annotationFixed) {
    hints.push("Click on an annotation to begin editing.");
  }
  if (this.points.length <= 1) {
    hints.push("Click to drop points.");
  }
  if (this.points.length <= 3) {
    hints.push("Press 'enter' to edit.");
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
window.editTool = editTool;
