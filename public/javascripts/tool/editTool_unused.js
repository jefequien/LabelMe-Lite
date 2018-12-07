

editTool.getIntersectionsSorted = function(path0, path1) {
  var c = path0.firstSegment;
  var intersections = path0.getIntersections(path1);
  intersections.sort(function(a, b) {
    a = c.point.getDistance(a.point);
    b = c.point.getDistance(b.point);
    return a - b;
  });
  return intersections;
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

editTool.splitAnnotation = function() {
  var num = this.annotation.boundary.children.length;
  if (num <= 1) {
    alert("Nothing to split.");
    return false;
  }

  if (confirm("Do you want to split this annotation into " + num +" annotations?")) {
    for (var i = 0; i < num; i++) {
      var newAnnotation = new Annotation(this.annotation.name);
      newAnnotation.unite(this.annotation.boundary.children[i]);
      newAnnotation.updateBoundary();
    }
    return true;
  } else {
    return false;
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