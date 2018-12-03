

var editTool = new Tool();

editTool.onMouseMove = function(event) {
  this.curser.position = event.point;
  this.snapCurser();

  // Set this.annotation
  if ( ! this.annotationFixed) {
    this.annotation = selectTool.getAnnotationAt(this.curser.position);
  }

  this.drawSelectedBoundary();
  this.drawBoundaryPoints();
  this.drawCurserArea();

  this.enforceStyles();
  this.writeHints();
}
editTool.onMouseClick = function(event) {
  this.onMouseMove(event);

  if (this.annotation) {
    this.annotationFixed = true;
  }
  if (this.annotationFixed) {
    this.points.push(this.curser.clone());
    this.save();
  }

  this.refreshTool();
}
editTool.onMouseDown = function(event) {
  this.dragDelta = 0;
  // Set this.dragPoint
  this.dragPoint = null;
  for (var i = 0; i < this.points.length; i++) {
    if (this.curser.intersects(this.points[i])) {
      this.dragPoint = this.points[i];
    }
  }
}
editTool.onMouseDrag = function(event) {
  this.curser.position = event.point;
  this.dragDelta += event.delta.length;
  if (this.dragPoint) {
    this.dragPoint.position += event.delta;
  } else {
    background.move(event.delta);
  }
  this.refreshTool();
}
editTool.onMouseUp = function(event) {
  if (this.dragDelta < 15 && this.dragPoint == null) {
    this.onMouseClick(event);
  } else {
    this.save();
  }
}
editTool.onKeyDown = function(event) {
  this.editKeys(event);
  if (event.key == 'enter') {
    this.editAnnotation();
    editTool.switch(this.annotation);
  }
  // Modes
  if (event.key == 'space') {
    this.invertedMode = ! this.invertedMode;
    this.refreshTool();
  }
  if (event.key == 'm') {
    this.noBoundaryMode = ! this.noBoundaryMode;
    this.refreshTool();
  }
  if (event.key == 'v') {
    scissors.toggleVisualize();
  }
  onKeyDownShared(event);
}
editTool.editKeys = function(event) {
  if ( ! this.annotation) {
    alert("Please select an annotation first.");
    return false;
  }

  if (event.key == 'u') {
    flashButton(undoAnnButton);
    var success = this.undo();
    if (! success) {
      this.annotation.undo();
    }
  }
  if (event.key == 'y') {
    flashButton(redoAnnButton);
    var success = this.annotation.redo();
    if (! success) {
      this.redo();
    }
  }
  if (event.key == 'backspace') {
    flashButton(deleteButton);
    if (this.points.length > 0) {
      for (var i = 0; i < this.points.length; i++) {
        this.points[i].remove();
      }
      this.points = [];
      this.save();
      this.refreshTool();
    } else {
      // Remove selected boundary
      var success = this.deleteSelectedBoundary();
      if ( ! success) {
        // Remove annotation
        var success = this.annotation.delete();
        if (success) {
          selectTool.switch();
        }
      }
    }
  }
}
editTool.deactivate = function() {
  this.button.className = this.button.className.replace(" active", "");

  this.curser.remove();
  this.bp0.remove();
  this.bp1.remove();
  this.bl.remove();
  this.segmentsJoined.remove();
  this.selectedBoundary.remove();
  this.selectedArea.remove();
  this.selectedAreaUnite.remove();
  this.selectedAreaSubtract.remove();
  this.curserArea.remove();

  for (var i = 0; i < this.points.length; i++) {
    this.points[i].remove();
  }
  for (var i = 0; i < this.segments.length; i++) {
    this.segments[i].remove();
  }
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

  this.points = [];
  this.segments = [];
  this.undoHistory = [];
  this.redoHistory = [];

  this.bp0 = this.curser.clone();
  this.bp1 = this.curser.clone();
  this.bl = new Path();
  this.segmentsJoined = new Path();
  this.selectedBoundary = new Path({closed: true});

  this.selectedArea = new Path({closed: true});
  this.selectedAreaUnite = new Path({closed: true});
  this.selectedAreaSubtract = new Path({closed: true});
  this.curserArea = new Path({closed: true});

  this.annotation = annotation;
  this.annotationFixed = (this.annotation != null);
  this.noBoundaryMode = false;
  this.invertedMode = false;

  this.refreshTool();
}
editTool.refreshTool = function() {
  paper.tool.onMouseMove({point: paper.tool.curser.position});

  // Move to refreshTool if too slow
  this.drawSegments();
  this.drawBoundaryLine();
  this.drawSelectedArea();
  this.enforceStyles();
}
editTool.undo = function() {
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
editTool.redo = function() {
  if (this.redoHistory != 0) {
    var checkpoint = this.redoHistory.pop();
    this.undoHistory.push(checkpoint);
    this.restore(checkpoint);
    this.refreshTool();
    return true;
  }
  return false;
}
editTool.restore = function(checkpoint) {
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
editTool.save = function() {
  var checkpoint = [];
  for (var i = 0; i < this.points.length; i++) {
    var pixel = background.getPixel(this.points[i].position);
    checkpoint.push(pixel);
  }
  this.undoHistory.push(checkpoint);
  this.redoHistory = [];
}

//
// Draw
//
editTool.drawSelectedBoundary = function() {
  // Set this.selectedBoundary
  var keyPoint = this.curser.position;
  if (this.points.length > 0) {
    keyPoint = this.points[0].position;
  }

  this.selectedBoundary.segments = [];
  if (this.annotation) {
    var boundaryPoint = this.annotation.boundary.getNearestPoint(keyPoint);
    for (var i = 0; i < this.annotation.boundary.children.length; i++) {
      var child = this.annotation.boundary.children[i];
      if (child.getLocationOf(boundaryPoint)) {
        this.selectedBoundary.segments = child.segments;
      }
    }
  }
}
editTool.drawSegments = function() {
  // Clear this.segments
  for (var i = 0; i < this.segments.length; i++) {
    this.segments[i].remove();
  }
  this.segments = [];

  // Set this.segments
  for (var i = 1; i < this.points.length; i++) {
    var p0 = this.points[i-1].position;
    var p1 = this.points[i].position;
    var path = new Path(p0, p1);
    this.segments.push(path);
  }
}
editTool.drawBoundaryPoints = function() {
  // Set this.bp0
  this.bp0.position = this.curser.position;
  if (this.points.length > 0) {
    var point = this.points[0].position;
    var bp = this.selectedBoundary.getNearestPoint(point);
    if (bp != null) {
      this.bp0.position = bp;
    } else {
      this.bp0.position = point;
    }
  }

  // Set this.bp1
  this.bp1.position = this.curser.position;
  if (this.points.length > 0) {
    var point = this.points[this.points.length-1].position;
    var bp = this.selectedBoundary.getNearestPoint(point);
    if (bp != null) {
      this.bp1.position = bp;
    } else {
      this.bp1.position = point;
    }
  }

  // Set this.segmentsJoined
  this.segmentsJoined.segments = [];
  for (var i = 0; i < this.points.length; i++) {
    this.segmentsJoined.add(this.points[i].position);
  }
  if (! this.noBoundaryMode) {
    this.segmentsJoined.insert(0, this.bp0.position);
    this.segmentsJoined.add(this.bp1.position);
    this.segmentsJoined.closed = false;
  } else {
    this.segmentsJoined.closed = true;
  }
}
editTool.drawCurserArea = function() {
  this.curserArea.segments = [];

  if (this.noBoundaryMode) {
    this.curserArea.add(this.curser.position);
    if (this.points.length > 0) {
      this.curserArea.add(this.points[this.points.length-1].position);
      this.curserArea.add(this.points[0].position);
    }
    return;
  }

  if (this.selectedBoundary.segments.length != 0) {
    var curserBp = this.selectedBoundary.getNearestPoint(this.curser.position);
    this.curserArea.add(curserBp);
    this.curserArea.add(this.curser.position);
    if (this.points.length > 0) {
      this.curserArea.add(this.points[this.points.length-1].position);
    }
    this.curserArea.add(this.bp1.position);
    var paths = this.getPathUsingBoundary(this.bp1.position, curserBp, this.selectedBoundary);
    if (paths.length != 0) {
      this.curserArea.join(paths[0]);
      paths[1].remove();
    }
  }
}
editTool.drawBoundaryLine = function() {
  if (this.noBoundaryMode) {
    this.bl.segments = [];
    return;
  }

  var paths = this.getPathUsingBoundary(this.bp1.position, this.bp0.position, this.selectedBoundary);
  if (paths.length == 0) {
    paths.push(new Path(this.bp1.position, this.bp0.position))
    paths.push(new Path(this.bp0.position, this.bp1.position));
  }
  paths[0].remove();
  paths[1].remove();

  var selectedArea0 = new Path({ closed: true });
  var selectedArea1 = new Path({ closed: true });
  selectedArea0.join(this.segmentsJoined.clone());
  selectedArea1.join(this.segmentsJoined.clone());
  selectedArea0.join(paths[0]);
  selectedArea1.join(paths[1]);

  var area0 = Math.abs(selectedArea0.area);
  var area1 = Math.abs(selectedArea1.area);
  selectedArea0.remove();
  selectedArea1.remove();

  var shorter = (area0 < area1 && !this.invertedMode) || (area0 > area1 && this.invertedMode);
  if (shorter) {
    this.bl.segments = paths[0].segments;
  } else {
    this.bl.segments = paths[1].segments;
  }
}
editTool.drawSelectedArea = function() {
  this.selectedArea.remove();
  this.selectedAreaUnite.remove();
  this.selectedAreaSubtract.remove();

  this.selectedArea = new Path({ closed: true });
  this.selectedArea.join(this.segmentsJoined.clone());
  if ( ! this.noBoundaryMode) {
    this.selectedArea.join(this.bl.clone());
  }

  if (this.annotation) {
    if (this.selectedBoundary.clockwise == this.annotation.boundary.clockwise) {
      this.selectedAreaUnite = this.selectedArea.subtract(this.selectedBoundary);
      this.selectedAreaSubtract = this.selectedArea.intersect(this.selectedBoundary);
    } else {
      this.selectedAreaSubtract = this.selectedArea.subtract(this.selectedBoundary);
      this.selectedAreaUnite = this.selectedArea.intersect(this.selectedBoundary);
    }
  }
}

//
// Edit Annotation
//
editTool.editAnnotation = function() {
  this.annotation.unite(this.selectedAreaUnite);
  this.annotation.subtract(this.selectedAreaSubtract);
  this.annotation.unitePath(this.segmentsJoined);

  this.annotation.updateBoundary();
  this.refreshTool();
}
editTool.deleteSelectedBoundary = function() {
  if (this.selectedBoundary.segments.length == 0) {
    return false;
  }

  if (this.selectedBoundary.clockwise == this.annotation.boundary.clockwise) {
    this.annotation.subtract(this.selectedBoundary);
  } else {
    this.annotation.unite(this.selectedBoundary);
  }

  this.annotation.updateBoundary();
  this.refreshTool();
  return true;
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

  // Snap to this.points
  for (var i = 0; i < this.points.length; i++) {
    if (this.curser.intersects(this.points[i])) {
      this.curser.position = this.points[i].position;
      break;
    }
  }
}
editTool.enforceStyles = function() {
  var pointHeight = this.toolSize * 1.5;
  var lineWidth = this.toolSize * 0.8;

  // this.annotation styles
  if (this.annotation) {
    this.annotation.highlight();
    this.annotation.raster.opacity = 0;
    this.annotation.boundary.strokeWidth = lineWidth;
    this.annotation.boundary.fillColor = "#00FF00";
    this.annotation.boundary.fillColor.alpha = 0.2;
  }

  // Other annotations styles
  for (var i = 0; i < annotations.length; i++) {
    if (annotations[i] != this.annotation) {
      if (this.annotationFixed) {
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
    point.fillColor = "black";
    point.strokeColor = "gold";
    point.strokeWidth = 0.5;
  }
  this.bp0.fillColor = "gold";
  this.bp0.strokeColor = "black";
  this.bp0.strokeWidth = 0.5;
  this.bp1.style = this.bp0.style;

  // Line styles
  this.bl.strokeColor = "black";
  this.bl.strokeWidth = lineWidth;
  for (var i = 0; i < this.segments.length; i++) {
    this.segments[i].strokeColor = "black";
    this.segments[i].strokeWidth = lineWidth;
  }
  this.selectedBoundary.strokeColor = "gold";
  this.selectedBoundary.strokeWidth = lineWidth;
  this.segmentsJoined.strokeColor = "gold";
  this.segmentsJoined.strokeWidth = lineWidth;


  // Area styles
  this.selectedArea.fillColor = "white"; // For debugging
  this.selectedAreaUnite.fillColor = "#00FF00";
  this.selectedAreaSubtract.fillColor = "red";
  this.selectedArea.opacity = 0.1;
  this.selectedAreaUnite.opacity = 0.3;
  this.selectedAreaSubtract.opacity = 0.3;

  this.curserArea.strokeColor = "black";
  this.curserArea.strokeWidth = lineWidth;
  this.curserArea.dashArray = [10,4];

  // Order
  this.selectedArea.bringToFront();
  this.curserArea.bringToFront();
  this.segmentsJoined.bringToFront();
  this.bl.bringToFront();
  for (var i = 0; i < allPoints.length; i++) {
    allPoints[i].bringToFront();
  }

  // Visibility
  this.bl.visible = ! this.noBoundaryMode;
  this.bp0.visible = ! this.noBoundaryMode;
  this.bp1.visible = ! this.noBoundaryMode;
}

//
// Path finding functions
//
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

  var paths = [path, other];
  paths.sort(function(a, b) {
    a = a.length;
    b = b.length;
    return a - b;
  });
  return paths;
}

editTool.writeHints = function() {
  var hints = [];
  if ( ! this.annotationFixed) {
    hints.push("Click on an annotation to begin editing.");
  }
  if (this.points.length <= 5) {
    hints.push("Click to drop points. Press 'enter' to edit.");
  }
  hints.push("Press 'esc' to quit.");

  $('#toolName').text(this.toolName);
  $('#toolMessage').text(hints[0]);
}

//
// Exports
//
window.editTool = editTool;
