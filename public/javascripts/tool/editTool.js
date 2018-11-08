

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
      if (child.contains(this.curser.position) || child.intersects(this.curser)) {
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
  var lastPoint = this.bp0.position;
  if (this.points.length > 0) {
    lastPoint = this.points[this.points.length-1].position;
  }
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
    this.selectedBoundary.fixed = true;
    if (this.selectedBoundary.segments.length == 0) {
      this.points.push(this.curser.clone());
      this.segments.push(this.line.clone());
    }
  } else {
    this.points.push(this.curser.clone());
    this.segments.push(this.line.clone());
  }

  // Edit
  if (this.bp1.isSet || this.curser.loopedBack) {
    var continuePoint = null;
    if (this.bp1.isSet) {
      this.editAnnotation();
      continuePoint = this.bp0.position;

    } else if (this.curser.loopedBack) {
      this.selectedArea.segments = [];
      for (var i = 1; i < this.segments.length; i++) {
        this.selectedArea.join(this.segments[i].clone());
      }
      this.editAnnotation();
      continuePoint = this.points[0].position;
    }

    // Continue
    editTool.switch(this.annotation);
    continuePoint = editTool.annotation.boundary.getNearestPoint(continuePoint);
    editTool.onMouseDown({point: continuePoint});
    editTool.onMouseMove(event);
  }
}
editTool.onKeyDown = function(event) {
  if (event.key == 'backspace') {
    if (this.selectedBoundary.fixed) {
      this.deleteSelectedBoundary();
      editTool.switch(this.annotation);
      return; // Prevent default
    }
  }
  else if (event.key == 'escape') {
    if (this.selectedBoundary.fixed) {
      editTool.switch(this.annotation);
      return; // Prevent default
    }
  } else if (event.key == 'n') {
    var success = this.splitAnnotation();
    if (success) {
      this.annotation.delete();
      selectTool.switch();
    }
    return; // Prevent default
  }
  else if (event.key == 'k') {
    this.cutAnnotation();
    editTool.switch(this.annotation);
  }
  else if (event.key == 'i') {
    this.invertedMode = ! this.invertedMode;
    this.refreshTool();
  }

  // Undo and redo
  if (event.key == 'u') {
    var undoed = this.annotation.undo();
    if (undoed) {
      editTool.switch(this.annotation);
    }
  }
  else if (event.key == 'y') {
    var redoed = this.annotation.redo();
    if (redoed) {
      editTool.switch(this.annotation);
    }
  }
  else if (event.key == 'z') {
    var undoed = this.undo();
    if ( ! undoed) {
      selectTool.switch();
    }
  }

  // Smart tool
  if (event.key == 't') {
    scissors.toggle();
    this.refreshTool();
  }
  else if (event.key == 'space') {
    scissors.toggleVisualize();
  }
  onKeyDownShared(event);
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
  this.interval = null;
}
editTool.switch = function(annotation) {
  this.toolName = "editTool";
  console.log("Switching to", this.toolName);
  var lastCurserPosition = paper.tool.curser.position;
  var lastToolSize = paper.tool.toolSize;
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
  this.toolSize = lastToolSize;

  this.annotation = annotation;

  this.points = [];
  this.segments = [];
  this.bp0 = this.curser.clone();
  this.bp1 = this.curser.clone();
  this.line = new Path();
  this.bl = new Path();
  this.selectedBoundary = new Path({ closed: true });
  this.selectedBoundaryPixels = [];
  this.selectedArea = new Path();

  this.selectedBoundary.fixed = false;
  this.curser.loopedBack = false;
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

//
// Edit Actions
//
editTool.editAnnotation = function() {
  if (this.mode == "unite") {
    this.annotation.unite(this.selectedArea);
  } else {
    this.annotation.subtractInterior(this.selectedArea);
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
editTool.splitAnnotation = function() {
  var num = this.annotation.boundary.children.length;
  if (num <= 1) {
    alert("Nothing to split.");
    return false;
  }

  if (confirm("Do you want to split this annotation into " + num +" annotations?")) {
    for (var i = 0; i < num; i++) {
      this.selectedBoundary.segments = this.annotation.boundary.children[i].segments;
      var newAnnotation = new Annotation(this.annotation.name);
      newAnnotation.unite(this.selectedBoundary);
      newAnnotation.updateBoundary();
    }
    return true;
  } else {
    return false;
  }
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
    if (this.points.length == 0 && this.selectedBoundary.segments.length == 0) {
      this.selectedBoundary.fixed = false;
    }
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
  var pointHeight = this.toolSize * 3;
  var lineWidth = this.toolSize;

  // Annotation styles
  for (var i = 0; i < annotations.length; i++) {
    if (annotations[i] != this.annotation) {
      annotations[i].hide();
    } else {
      this.annotation.highlight();
    }
  }
  this.annotation.raster.opacity = 0.2;
  this.annotation.boundary.strokeWidth = lineWidth;

  // Point styles
  var allPoints = this.points.concat([this.bp0, this.bp1, this.curser]);
  for (var i = 0; i < allPoints.length; i++) {
    var point = allPoints[i];
    point.scale(pointHeight / point.bounds.height);
    if (this.mode == "unite") {
      point.fillColor = "#00FF00";
    } else {
      point.fillColor = "red";
    }
  }
  this.bp0.fillColor = "gold";
  this.bp0.strokeColor = "black";
  this.bp0.strokeWidth = 0.5;
  this.bp1.style = this.bp0.style;
  if ( ! this.selectedBoundary.fixed) {
    this.bp0.strokeWidth = 0;
  }

  // Line styles
  this.selectedBoundary.strokeColor = "gold";
  this.selectedBoundary.strokeWidth = lineWidth;
  this.line.strokeColor = "black";
  this.line.strokeWidth = lineWidth;
  this.bl.strokeColor = "black";
  this.bl.strokeWidth = lineWidth;
  this.bl.dashArray = [10, 4];
  for (var i = 0; i < this.segments.length; i++) {
    this.segments[i].strokeColor = "black";
    this.segments[i].strokeWidth = lineWidth;
  }

  // this.selectedArea
  this.selectedArea.opacity = 0.3;
  if (this.mode == "unite") {
    this.selectedArea.fillColor = "#00FF00";
  } else {
    this.selectedArea.fillColor = "red";
  }

  // Visibility
  this.bp0.visible = (this.selectedBoundary.fixed || this.selectedBoundary.segments.length == 0);
  this.line.visible = this.selectedBoundary.fixed;
  this.curser.visible = this.selectedBoundary.fixed;
  this.bp1.visible = this.bp1.isSet;
  if (this.segments.length > 0) {
    this.segments[0].visible = ! this.curser.loopedBack;
    this.bp0.visible = ! this.curser.loopedBack;
  }
  if (this.selectedBoundary.fixed) {
    this.selectedBoundary.strokeWidth *= 1.5;
  }

  // Order
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
  if (scissors.active && this.selectedBoundary.fixed) {
    // Try pixels along line
    var start = boundary.getNearestPoint(point);
    var path = new Path.Line(start, point);
    background.toPixelSpace(path);
    path.remove();

    for (var i = 0; i < path.length; i+=20) {
      var p1 = path.getPointAt(path.length-i);
      if (this.selectedBoundary.segments.length == 0) {
        break;
      }

      // Get boundary pixels
      if (this.selectedBoundaryPixels.length == 0) {
        var pixels = background.getBoundaryPixels(this.selectedBoundary);
        for (var i = 0; i < pixels.length; i++) {
          this.selectedBoundaryPixels.push([pixels[i].x, pixels[i].y]);
        }
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
  if (other == null) {
    // No path using boundary
    path.remove();
    return new Path(point0, point1);
  }

  // Return shorter path
  other.reverse();
  var shorter = null;
  var longer = null;
  if (path.length < other.length) {
    shorter = path;
    longer = other;
  } else {
    shorter = other;
    longer = path;
  }

  if ( ! this.invertedMode) {
    longer.remove();
    return shorter;
  } else {
    shorter.remove();
    return longer;
  }
}

//
// Exports
//
window.editTool = editTool;
