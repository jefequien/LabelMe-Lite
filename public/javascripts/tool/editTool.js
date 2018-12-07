

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
  this.drawSegments();
  this.drawBoundaryLine();
  this.drawEditedBoundary();
  this.drawSelectedArea();

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
    if (this.mode == "normal") {
      this.mode = "smaller";
    } else if (this.mode == "smaller") {
      this.mode = "noBoundary";
    } else if (this.mode == "noBoundary") {
      this.mode = "normal";
    }
    this.refreshTool();
  }

  if (event.key == 'v') {
    scissors.toggleVisualize();
  }
  onKeyDownShared(event);
}
editTool.editKeys = function(event) {
  if (event.key == 'u') {
    var success = this.undo();
    if (! success) {
      this.annotation.undo();
    }
    flashButton("undo");
  }
  if (event.key == 'y') {
    var success = this.annotation.redo();
    if (! success) {
      this.redo();
    }
    flashButton("redo");
  }
  if (event.key == 'backspace') {
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
      // if ( ! success) {
      //   // Remove annotation
      //   var success = this.annotation.delete();
      //   if (success) {
      //     selectTool.switch();
      //   }
      // }
    }
    flashButton("delete");
  }
}
editTool.deactivate = function() {
  this.curser.remove();
  this.bp0.remove();
  this.bp1.remove();
  this.bl.remove();
  this.segmentsJoined.remove();
  this.selectedBoundary.remove();
  this.editedBoundary.remove();
  this.selectedArea.remove();
  for (var i = 0; i < this.points.length; i++) {
    this.points[i].remove();
  }
  for (var i = 0; i < this.segments.length; i++) {
    this.segments[i].remove();
  }

  deactivateButton(this.toolName);
}
editTool.switch = function(annotation) {
  var lastCurserPosition = paper.tool.curser.position;
  var lastToolSize = paper.tool.toolSize;

  this.toolName = "editTool";
  console.log("Switching to", this.toolName);
  paper.tool.deactivate();
  this.activate();
  activateButton(this.toolName);

  this.annotation = annotation;
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
  this.editedBoundary = new Path({closed: true});
  this.selectedArea = new CompoundPath({fillRule: "evenodd"});

  this.annotationFixed = (this.annotation != null);
  this.mode = "normal";

  this.refreshTool();
}
editTool.refreshTool = function() {
  paper.tool.onMouseMove({point: paper.tool.curser.position});
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
  this.selectedBoundary.segments = [];

  // Set this.selectedBoundary
  if (this.annotation) {
    var keyPoint = this.curser.position;
    if (this.points.length > 0) {
      keyPoint = this.points[0].position;
    }
    keyPoint = this.annotation.boundary.getNearestPoint(keyPoint);

    for (var i = 0; i < this.annotation.boundary.children.length; i++) {
      var child = this.annotation.boundary.children[i];
      if (child.getLocationOf(keyPoint)) {
        this.selectedBoundary.segments = child.segments;
      }
    }
  }
}
editTool.drawBoundaryPoints = function() {
  // Set this.bp0
  var keyPoint = this.curser.position;
  if (this.points.length > 0) {
    keyPoint = this.points[0].position;
  }
  var bp = this.selectedBoundary.getNearestPoint(keyPoint);
  if (bp) {
    this.bp0.position = bp;
  } else {
    this.bp0.position = keyPoint;
  }

  // Set this.bp1
  var keyPoint = this.curser.position;
  if (this.points.length > 0) {
    keyPoint = this.points[this.points.length-1].position;
  }
  var bp = this.selectedBoundary.getNearestPoint(keyPoint);
  if (bp) {
    this.bp1.position = bp;
  } else {
    this.bp1.position = keyPoint;
  }
}
editTool.drawSegments = function() {
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

  // Set this.segmentsJoined
  this.segmentsJoined.segments = [];
  for (var i = 0; i < this.points.length; i++) {
    this.segmentsJoined.add(this.points[i].position);
  }
  if (this.mode == "noBoundary") {
    this.segmentsJoined.closed = true;
  } else {
    this.segmentsJoined.insert(0, this.bp0.position);
    this.segmentsJoined.add(this.bp1.position);
    this.segmentsJoined.closed = false;
  }
}
editTool.drawBoundaryLine = function() {
  this.bl.segments = [];
  if (this.mode == "noBoundary") {
    return;
  }

  var paths = this.getPathUsingBoundary(this.bp1.position, this.bp0.position, this.selectedBoundary);
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

  if ((area0 > area1 && this.mode == "normal") || (area0 < area1 && this.mode == "smaller")) {
    this.bl.segments = paths[0].segments;
  } else {
    this.bl.segments = paths[1].segments;
  }
}
editTool.drawEditedBoundary = function() {
  this.editedBoundary.segments = [];
  this.editedBoundary.join(this.segmentsJoined.clone());
  if (this.mode != "noBoundary") {
    this.editedBoundary.join(this.bl.clone());
  }
  this.editedBoundary.closed = true;
}
editTool.drawSelectedArea = function() {
  this.selectedArea.children = [];

  if (this.annotation) {
    var childrenList = [];
    var keyPoint = this.bp0.position;
    for (var i = 0; i < this.annotation.boundary.children.length; i++) {
      var child = this.annotation.boundary.children[i];
      if (child.getLocationOf(keyPoint) && this.mode != "noBoundary") {
        continue;
      }
      var path = new Path({closed: true});
      path.segments = child.segments;
      childrenList.push(path);
    }
    childrenList.push(this.editedBoundary.clone());
    this.selectedArea.children = childrenList;
  }
}

//
// Edit Annotation
//
editTool.editAnnotation = function() {
  this.annotation.subtract(this.annotation.boundary);
  this.annotation.unite(this.selectedArea);
  this.annotation.updateBoundary();
  this.refreshTool();
  this.undoHistory = [];
}
editTool.deleteSelectedBoundary = function() {
  this.editedBoundary.segments = [];
  this.drawSelectedArea();
  this.editAnnotation();
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
    this.annotation.boundary.strokeWidth = 0;
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
  this.selectedBoundary.strokeColor = "black";
  this.selectedBoundary.strokeWidth = lineWidth;
  this.editedBoundary.strokeColor = "gold";
  this.editedBoundary.strokeWidth = lineWidth;

  // Area styles
  this.selectedArea.strokeColor = "white";
  this.selectedArea.strokeWidth = lineWidth;
  this.selectedArea.fillColor = "white";
  if (this.annotation) {
    this.selectedArea.strokeColor = this.annotation.color;
    this.selectedArea.fillColor = this.annotation.color;
  }
  this.selectedArea.fillColor.alpha = 0.2;

  // For debugging
  for (var i = 0; i < this.segments.length; i++) {
    this.segments[i].strokeColor = "orange";
    this.segments[i].strokeWidth = 0;
  }
  this.segmentsJoined.strokeColor = "yellow";
  this.segmentsJoined.strokeWidth = 0;
  this.bl.strokeColor = "green";
  this.bl.strokeWidth = 0;

  // Order
  this.selectedArea.bringToFront();
  this.editedBoundary.bringToFront();
  for (var i = 0; i < allPoints.length; i++) {
    allPoints[i].bringToFront();
  }

  // Visibility
  if (this.mode == "noBoundary") {
    this.bp0.opacity = 0;
    this.bp1.opacity = 0;
  } else {
    this.bp0.opacity = 1;
    this.bp1.opacity = 1;
  }
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
    other = new Path(point0, point1);
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
  if (this.points.length <= 2) {
    hints.push("Click to drop points. Points are draggable.");
  }
  if (this.points.length <= 4) {
    hints.push("Press 'm' to cycle through modes.");
  }
  hints.push("Press 'enter' to edit. Press 'esc' to quit.");

  $('#toolName').text(this.toolName);
  $('#toolMessage').text(hints[0]);
}

//
// Exports
//
window.editTool = editTool;
