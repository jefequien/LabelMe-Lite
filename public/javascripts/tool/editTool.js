

var editTool = new Tool();

editTool.onMouseMove = function(event) {
  this.curser.position = event.point;
  this.snapCurser();

  if (this.trace.segments.length > 0) {
    this.trace.removeSegment(this.trace.segments.length-1);
  }

  this.trace.add(this.curser.position);
  this.drawAll();
}
editTool.onMouseDrag = function(event) {
  this.curser.position = event.point;
  this.snapCurser();

  this.dragging = true;

  this.trace.add(this.curser.position);
  this.drawAll();
}
editTool.onMouseDown = function(event) {
  this.curser.position = event.point;
  this.snapCurser();

  this.annotationFixed = true;

  this.trace.add(this.curser.position);
  this.drawAll();
}
editTool.onMouseUp = function(event) {
  this.curser.position = event.point;
  this.snapCurser();

  if (this.dragging || this.clicked) {
    this.editAnnotation();
    this.trace.removeSegments();
    this.dragging = false;
    this.clicked = false;
  } else {
    this.dragging = false;
    this.clicked = true;
  }

  this.trace.add(this.curser.position);
  this.drawAll();
}
editTool.onKeyDown = function(event) {
  if (event.key == 'u') {
    flashButton("undo");
    this.annotation.undo();
    this.refreshTool();
  }
  else if (event.key == 'y') {
    flashButton("redo");
    this.annotation.redo();
    this.refreshTool();
  }
  else if (event.key == 'backspace') {
    if (this.trace.segments.length > 1) {
      this.trace.removeSegments();
      this.trace.add(this.curser.position);
    } else {
      this.deleteClosestBoundary();
    }
    this.refreshTool();
  }
  else if (event.key == 'i') {
    this.inverted = ! this.inverted;
    this.refreshTool();
  }
  
  if (event.key == 'escape') {
    selectTool.switch();
  }
  onKeyDownShared(event);
}
editTool.deactivate = function() {
  this.curser.remove();
  this.trace.remove();
  this.closestBoundary.remove();
  this.otherBoundaries.remove();
  this.bl0.remove();
  this.bl1.remove();
  this.editedBoundary.remove();
  this.selectedArea.remove();

  deactivateButton(this.toolName);
}
editTool.switch = function() {
  var lastAnnotation = paper.tool.annotation;
  var lastCurserPosition = paper.tool.curser.position;
  var lastToolSize = paper.tool.toolSize;

  this.toolName = "editTool";
  console.log("Switching to", this.toolName);
  paper.tool.deactivate();
  this.activate();
  activateButton(this.toolName);

  this.annotation = lastAnnotation;
  this.annotationFixed = (this.annotation != null);
  this.curser = new Shape.Circle(lastCurserPosition, 1);
  this.toolSize = lastToolSize;

  // Setup tool
  this.trace = new Path();
  this.closestBoundary = new Path({closed: true});
  this.otherBoundaries = new CompoundPath({fillRule: "evenodd"});
  this.bl0 = new Path();
  this.bl1 = new Path();
  this.editedBoundary = new Path({closed: true});
  this.selectedArea = new CompoundPath({fillRule: "evenodd"});

  this.refreshTool();
}
editTool.refreshTool = function() {
  this.onMouseMove({point: paper.tool.curser.position});
}

//
// Draw
//
editTool.drawAll = function() {
  // Visualize all
  this.setAnnotation();
  this.splitAnnotationBoundary();
  this.drawBoundaryLines();
  this.drawEditedBoundary();
  this.drawSelectedArea();
  this.enforceStyles();
}
editTool.setAnnotation = function() {
  // Set this.annotation
  if ( ! this.annotationFixed) {
    this.annotation = selectTool.getAnnotationAt(this.curser.position);
    if (this.annotation == null) {
      this.annotation = selectTool.getNearestAnnotation(this.curser.position);
    }
  }
}
editTool.splitAnnotationBoundary = function() {
  this.closestBoundary.segments = [];
  this.otherBoundaries.children = [];
  // Set this.closestBoundary
  if (this.annotation) {
    var keyPoint = this.annotation.boundary.getNearestPoint(this.trace.firstSegment.point);
    var childrenList = [];
    for (var i = 0; i < this.annotation.boundary.children.length; i++) {
      var child = this.annotation.boundary.children[i];
      if (child.getLocationOf(keyPoint)) {
        this.closestBoundary.segments = child.segments;
      } else {
        var path = new Path({closed: true});
        path.segments = child.segments;
        childrenList.push(path);
      }
    }
    this.otherBoundaries.children = childrenList;
  }
}
editTool.drawBoundaryLines = function() {
  this.bl0.segments = [];
  this.bl1.segments = [];

  var point0 = this.trace.firstSegment.point;
  var point1 = this.trace.lastSegment.point;
  var paths = this.getPathUsingBoundary(point1, point0, this.closestBoundary);
  paths[0].remove();
  paths[1].remove();

  // Choose path that yields the larger area
  var selectedArea0 = new Path({ closed: true });
  var selectedArea1 = new Path({ closed: true });
  selectedArea0.join(this.trace.clone());
  selectedArea1.join(this.trace.clone());
  selectedArea0.join(paths[0]);
  selectedArea1.join(paths[1]);
  selectedArea0.remove();
  selectedArea1.remove();

  var area0 = Math.abs(selectedArea0.area);
  var area1 = Math.abs(selectedArea1.area);
  if ((area0 > area1 && !this.inverted) || (area0 < area1 && this.inverted)) {
    this.bl0.segments = paths[0].segments;
    this.bl1.segments = paths[1].segments;
  } else {
    this.bl0.segments = paths[1].segments;
    this.bl1.segments = paths[0].segments;
  }
}
editTool.drawEditedBoundary = function() {
  this.editedBoundary.segments = [];

  var d0 = this.trace.lastSegment.point.getDistance(this.trace.firstSegment.point);
  var d1 = this.trace.lastSegment.point.getDistance(this.bl0.firstSegment.point);
  if (d0 > d1 || d1 < 20) {
    this.editedBoundary.join(this.trace.clone());
    this.editedBoundary.join(this.bl0.clone());
  } else {
    this.editedBoundary.join(this.trace.clone());

    var path = new Path({closed: true});
    path.segments = this.closestBoundary.segments;
    path.remove();
    this.otherBoundaries.children.push(path);
  }
}
editTool.drawSelectedArea = function() {
  this.selectedArea.children = [];

  var childrenList = [];
  for (var i = 0; i < this.otherBoundaries.children.length; i++) {
    var path = new Path({closed: true});
    path.segments = this.otherBoundaries.children[i].segments;
    childrenList.push(path);
  }
  var path = new Path({closed: true});
  path.segments = this.editedBoundary.segments;
  childrenList.push(path);
  this.selectedArea.children = childrenList;
}

//
// Edit Annotation
//
editTool.editAnnotation = function() {
  if (this.annotation) {
    this.annotation.updateRaster(this.selectedArea);
    this.annotation.updateBoundary();
    this.inverted = false;
  }
}
editTool.deleteClosestBoundary = function() {
  if (this.closestBoundary.segments.length != 0) {
    this.splitAnnotationBoundary();
    this.closestBoundary.segments = [];
    this.drawBoundaryLines();
    this.drawEditedBoundary();
    this.drawSelectedArea();
    this.editAnnotation();
  }
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
  var pointHeight = this.toolSize * 2;
  var lineWidth = this.toolSize * 0.5;
  var color0 = "white";
  var color1 = "blue";

  // this.annotation styles
  if (this.annotation) {
    this.annotation.highlight();
    this.annotation.raster.opacity = 0;
    this.annotation.boundary.strokeWidth = 0;
    color0 = this.annotation.color;
    color1 = this.annotation.colorinv;
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
  this.curser.scale(pointHeight / this.curser.bounds.height);
  this.curser.fillColor = color0;

  // Line styles
  this.trace.strokeColor = "red";
  this.closestBoundary.strokeColor = "black";
  this.otherBoundaries.strokeColor = "yellow"
  this.bl0.strokeColor = "green";
  this.bl1.strokeColor = "blue";
  this.editedBoundary.strokeColor = color0;
  this.selectedArea.strokeColor = color1;
  this.selectedArea.fillColor = color1;
  this.selectedArea.fillColor.alpha = 0.7;

  this.trace.strokeWidth = lineWidth;
  this.closestBoundary.strokeWidth = lineWidth;
  this.otherBoundaries.strokeWidth = lineWidth;
  this.bl0.strokeWidth = lineWidth;
  this.bl1.strokeWidth = lineWidth;
  this.editedBoundary.strokeWidth = lineWidth;
  this.selectedArea.strokeWidth = lineWidth;

  // Order
  this.selectedArea.bringToFront();
  this.editedBoundary.bringToFront();
  this.curser.bringToFront();

  if (this.trace.length == 0) {
    this.closestBoundary.strokeColor = color0;
    this.closestBoundary.bringToFront();
  }
}

//
// Path finding functions
//
editTool.getPathUsingBoundary = function(point0, point1, boundary) {
  var path = boundary.clone();
  var p0 = path.getLocationOf(path.getNearestPoint(point0));
  var p1 = path.getLocationOf(path.getNearestPoint(point1));
  path.splitAt(p0);
  var other = path.splitAt(p1);

  if (path == null) {
    path = new Path(point0, point1);
  }
  if (other == null) {
    other = new Path(point0, point1);
  }
  other.reverse();
  return [path, other];
}

//
// Exports
//
window.editTool = editTool;
