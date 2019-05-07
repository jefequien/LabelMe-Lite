

var editTool = new Tool();

editTool.onMouseMove = function(event) {
  this.curser.position = event.point;
  this.snapCurser();

  this.annotation = selectTool.getNearestAnnotation(this.curser.position);
  if (this.trace.segments.length > 0) {
    this.trace.removeSegment(this.trace.segments.length-1);
  }

  this.trace.add(this.curser.position);
  this.drawEverything();
}
editTool.onMouseDrag = function(event) {
  this.curser.position = event.point;
  this.snapCurser();

  this.dragDelta += event.delta.length;
  if (this.dragDelta > 10) {
    this.dragging = true;
  }

  this.trace.add(this.curser.position);
  this.drawEverything();
}
editTool.onMouseDown = function(event) {
  this.curser.position = event.point;
  this.snapCurser();

  this.dragDelta = 0;
  this.numClicks = this.numClicks + 1 || 1;

  this.trace.add(this.curser.position);
  this.drawEverything();
}
editTool.onMouseUp = function(event) {
  this.curser.position = event.point;
  this.snapCurser();

  if (this.dragging || this.numClicks == 2) {
    this.editAnnotation();
    this.trace.removeSegments();
    this.numClicks = 0;
  }
  this.dragging = false;

  this.trace.add(this.curser.position);
  this.drawEverything();
}
editTool.onKeyDown = function(event) {
  if (event.key == 'u') {
    this.annotation.undo();
    this.refreshTool();
    flashButton("undo");
  } else if (event.key == 'y') {
    this.annotation.redo();
    this.refreshTool();
    flashButton("redo");
  }
  if (event.key == 'escape') {
    selectTool.switch();
  }

  if (event.key == 'backspace') {
    this.deleteNearestBoundary();
    this.refreshTool();
  }
  if (event.key == 'space') {
    this.editAnnotation();
    this.trace.removeSegments();
    this.dragging = false;

    this.annealBoundary();
    this.refreshTool();
  }
  onKeyDownShared(event);
}
editTool.deactivate = function() {
  this.curser.remove();
  this.trace.remove();
  this.bl0.remove();
  this.bl1.remove();
  this.editedBoundary.remove();
  this.boundary.remove();
  this.boundaryInv.remove();
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
  this.curser = new Shape.Circle(lastCurserPosition, 1);
  this.toolSize = lastToolSize;

  // Tool shapes
  this.trace = new Path();
  this.bl0 = new Path();
  this.bl1 = new Path();
  this.editedBoundary = new Path({closed: true});
  this.boundary = new CompoundPath({fillRule: "evenodd"});
  this.boundaryInv = new CompoundPath({fillRule: "evenodd"});
  this.refreshTool();
}
editTool.refreshTool = function() {
  this.onMouseMove({point: paper.tool.curser.position});
}

//
// Edit Functions
//
editTool.editAnnotation = function() {
  if ( ! this.annotation) {
    return;
  }
  this.annotation.updateRaster(this.boundary);
  this.annotation.updateBoundary();
}
editTool.deleteNearestBoundary = function() {
  if ( ! this.annotation) {
    return;
  }

  var point = this.annotation.boundary.getNearestPoint(this.curser.position);
  var boundary = new CompoundPath({fillRule: "evenodd"});
  for (var i = 0; i < this.annotation.boundary.children.length; i++) {
    var child = this.annotation.boundary.children[i];
    if ( ! child.getLocationOf(point)) {
      var path = new Path({closed: true});
      path.segments = child.segments;
      boundary.children.push(path);
    }
  }
  boundary.remove();
  this.boundary.children = boundary.children;
  this.editAnnotation();
}
editTool.annealBoundary = function() {
  if ( ! this.annotation) {
    return;
  }
  console.log("Annealing boundary");
  var cannyData = background.canny.getImageData();
  var h = cannyData.height;
  var w = cannyData.width;

  toPixelSpace(this.annotation.boundary, background.canny);
  for (var i = 0; i < this.annotation.boundary.children.length; i++) {
    var child = this.annotation.boundary.children[i];
    for (var j = 0; j < child.segments.length; j++) {
      var segment = child.segments[j];
      var point = segment.point.round();

      var maxValue = 0;
      var maxPoint = point;
      var maxDist = 100;
      for (var dx = -3; dx <= 3; dx++) {
        for (var dy = -3; dy <= 3; dy++) {
          var d = new Point(dx, dy);
          var p = point + d;
          var value;
          if (p.x >= 0 && p.y >= 0 && p.x < w && p.y < h) {
            var index = (p.y * w + p.x) * 4;
            value = cannyData.data[index];
          } else {
            value = 256; // Anneal to image boundary
          }
          if (value > maxValue) {
            maxPoint = p;
            maxValue = value;
            maxDist = d.length;
          } else if (value == maxValue && d.length < maxDist) {
            maxPoint = p;
            maxDist = d.length;
          }
        }
      }
      segment.point = maxPoint;
    }
  }
  toPointSpace(this.annotation.boundary, background.canny);
  this.annotation.updateRaster();
  this.annotation.updateBoundary();
}

//
// Draw Functions
//
editTool.drawEverything = function() {
  // Visualize all
  if (this.annotation) {
    this.drawBoundaryLines();
    this.drawEditedBoundary();
    this.drawBoundary();
    this.drawBoundaryInv();
  }
  this.enforceStyles();
}
editTool.drawBoundaryLines = function() {
  this.bl0.segments = [];
  this.bl1.segments = [];
  var paths = getRouteAlongCompoundPath(this.trace.lastSegment.point, 
                                        this.trace.firstSegment.point, 
                                        this.annotation.boundary);
  // Sort paths by enclosed area
  var area0 = new Path({ closed: true });
  var area1 = new Path({ closed: true });
  area0.join(this.trace.clone());
  area1.join(this.trace.clone());
  area0.join(paths[0]);
  area1.join(paths[1]);
  var a0 = Math.abs(area0.area);
  var a1 = Math.abs(area1.area);

  paths[0].remove();
  paths[1].remove();
  area0.remove();
  area1.remove();
  this.bl0.segments = (a0 > a1) ? paths[0].segments : paths[1].segments;
  this.bl1.segments = (a0 > a1) ? paths[1].segments : paths[0].segments;
}
editTool.drawEditedBoundary = function() {
  this.editedBoundary.segments = [];

  var loopDistance = this.trace.firstSegment.point.getDistance(this.trace.lastSegment.point);
  var boundaryDistance = this.bl0.firstSegment.point.getDistance(this.trace.lastSegment.point);
  if (boundaryDistance < loopDistance || boundaryDistance < 20) {
    this.editedBoundary.join(this.trace.clone());
    this.editedBoundary.join(this.bl0.clone());
  } else {
    this.editedBoundary.join(this.trace.clone());
  }
}
editTool.drawBoundary = function() {
  var boundary = new CompoundPath({fillRule: "evenodd"});
  for (var i = 0; i < this.annotation.boundary.children.length; i++) {
    var child = this.annotation.boundary.children[i];
    if ( ! this.editedBoundary.intersects(child)) {
      var path = new Path({closed: true});
      path.segments = child.segments;
      boundary.children.push(path);
    }
  }
  var path = new Path({closed: true});
  path.segments = this.editedBoundary.segments;
  boundary.children.push(path);
  boundary.remove();
  this.boundary.children = boundary.children;
}
editTool.drawBoundaryInv = function() {
  var boundaryinv = new CompoundPath({
    children: [new Path.Rectangle(this.annotation.raster.bounds), this.boundary.clone()],
    fillRule: "evenodd"
  });
  boundaryinv.remove();
  this.boundaryInv.children = boundaryinv.children;
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
  // Annotation styles
  for (var i = 0; i < annotations.length; i++) {
    if (annotations[i] == this.annotation) {
      annotations[i].highlight();
      annotations[i].hide();
    } else {
      annotations[i].unhighlight();
    }
  }

  // Constants
  var pointHeight = this.toolSize * 1.5;
  var lineWidth = this.toolSize * 0.4;
  var color0 = "white";
  var color1 = "blue";

  // Point styles
  this.curser.scale(pointHeight / this.curser.bounds.height);
  this.curser.fillColor = color0;

  // Line styles
  this.trace.strokeColor = "red";
  this.bl0.strokeColor = "orange";
  this.bl1.strokeColor = "black";
  this.editedBoundary.strokeColor = "green";

  this.boundary.strokeColor = color0;
  this.boundary.fillColor = color1;
  this.boundaryInv.fillColor = color1;
  this.boundary.strokeWidth = lineWidth;
  this.bl1.strokeWidth = lineWidth;

  // Fill styles
  if (this.annotation && this.annotation.boundary.contains(this.curser.position)) {
    this.boundary.fillColor.alpha = 0;
    this.boundaryInv.fillColor.alpha = 0;
  } else {
    this.boundary.fillColor.alpha = 0.7;
    this.boundaryInv.fillColor.alpha = 0;
  }
}

//
// Path finding functions
//
function getRouteAlongCompoundPath(point0, point1, compoundPath) {
  var p0 = compoundPath.getNearestPoint(point0);
  var p1 = compoundPath.getNearestPoint(point1);
  if (p0 == null || p1 == null) {
    var path0 = new Path(point0, point1);
    var path1 = new Path(point0, point1);
    path1.reverse();
    return [path0, path1];
  }

  for (var i = 0; i < compoundPath.children.length; i++) {
    var child = compoundPath.children[i];
    if (child.getLocationOf(p0)) {
      return getRouteAlongPath(point0, point1, child);
    }
  }
}
function getRouteAlongPath(point0, point1, path) {
  var p0 = path.getNearestPoint(point0);
  var p1 = path.getNearestPoint(point1);
  if (p0 == null || p1 == null) {
    var path0 = new Path(point0, point1);
    var path1 = new Path(point0, point1);
    path1.reverse();
    return [path0, path1];
  }

  var path0 = path.clone();
  var _____ = path0.splitAt(path0.getLocationOf(p0));
  var path1 = path0.splitAt(path0.getLocationOf(p1));

  path0 = (path0) ? path0 : new Path(point0, point1);
  path1 = (path1) ? path1 : new Path(point0, point1);
  path1.reverse();
  return [path0, path1];
}

//
// Exports
//
window.editTool = editTool;
