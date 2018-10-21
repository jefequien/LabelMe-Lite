
function customizeAMT() {
  var annotation = annotations[0];

  background.max_height = 250;
  background.max_width = 500;
  background.focus(annotation);
  background.max_height = 500;
  background.max_width = 700;

  background.fixed = true;
  // editTool.switch(annotation);
  // annotation.boundary.strokeColor = new Color(0,0,0,0);
  // annotation.raster.opacity = 0.7;
}
window.setUpTool = function(task) {
  var image_url = task["image_url"];
  background.image = new Raster(image_url);
  background.image.onLoad = function() {
    loadAnnotations(task);
    customizeAMT();
  }
}
window.clearTool = function() {
  if (background.image) {
    background.image.remove();
  }
  for (var i = 0; i < annotations.length; i++) {
    annotations[i].delete();
  }
  background = new Background();
  annotations = [];
  selectTool.switch();
}
window.saveAnnotations = saveAnnotations;


/**
 * Annotation tool powered by PaperJS.
 * This tool has many features removed.
 */

var background = new Background();
var annotations = [];

function loadAnnotations(task) {
  var data = task["annotations"];
  for (var i = 0; i < data.length; i++) {
    var category = data[i]["category"];
    var rle = data[i]["segmentation"];
    var mask = rleToMask(rle);
    var annotation = new Annotation(mask, category);
    annotation.updateBoundary();
    annotation.unhighlight();
  }
}

function saveAnnotations() {
  var anns = [];
  for (var i = 0; i < annotations.length; i++) {
    var mask = annotations[i].toMask();
    var rle = maskToRLE(mask);

    var ann = {};
    ann["category"] = annotations[i].name;
    ann["segmentation"] = rle;
    anns.push(ann);
  }
  return anns;
}

//
// Background Class
//
function Background(){
  this.canvas = document.getElementById('toolCanvas');
  this.center = new Point(this.canvas.width/2, this.canvas.height/2);
  this.max_height = 500;
  this.max_width = 700;
  this.fixed = false;
}
Background.prototype.move = function(delta) {
  if ( ! this.fixed) {
    this.image.translate(delta);
    for (var i = 0; i < annotations.length; i++){
      annotations[i].translate(delta);
    }
  }
}
Background.prototype.scale = function(ratio) {
  this.image.scale(ratio, this.center);
  for (var i = 0; i < annotations.length; i++){
      annotations[i].scale(ratio, this.center);
  }
}
Background.prototype.centerPoint = function(point) {
    var x = this.center.x;
    var y = this.center.y;
    var dx = x - point.x;
    var dy = y - point.y;
    this.move(new Point(dx,dy));
}
Background.prototype.focus = function(annotation) {
  var bounds = this.image.bounds;
  if (annotation) {
    bounds = annotation.boundary.bounds;
  }
  var ratio = Math.min(this.max_height/bounds.height, this.max_width/bounds.width);
  this.centerPoint(bounds.center);
  this.scale(ratio);
}
Background.prototype.getBlank = function() {
  var blank = new Raster({
      size: {
          width: this.image.width,
          height: this.image.height
      }
  });
  bbox = this.image.bounds;
  blank.scale(bbox.height/blank.height);
  blank.position = bbox.center;
  return blank;
}
Background.prototype.getPixel = function(point) {
  if ( ! this.image) { return null; }
  var bounds = this.image.bounds;
  var ratio = bounds.height / this.image.height;
  var pixelX = Math.round((point.x - bounds.x) / ratio);
  var pixelY = Math.round((point.y - bounds.y) / ratio);
  return new Point(pixelX, pixelY);
}
Background.prototype.getPoint = function(pixel) {
  if ( ! this.image) { return null; }
  var bounds = this.image.bounds;
  var ratio = bounds.height / this.image.height;
  var pointX = pixel.x * ratio + bounds.x;
  var pointY = pixel.y * ratio + bounds.y;
  return new Point(pointX, pointY);
}
Background.prototype.toPointSpace = function(shape) {
  if ( ! this.image) { return null; }
  var ratio = this.image.bounds.height / this.image.height;
  shape.translate(this.image.bounds.topLeft);
  shape.scale(ratio, this.image.bounds.topLeft);
}


function Annotation(mask, name){
  this.name = name;
  this.color = new Color(Math.random(), Math.random(), Math.random(), 1);

  this.raster = background.getBlank();
  this.raster.setImageData(maskToImageData(mask, this.color), new Point(0, 0));
  this.id = this.raster.id;

  annotations.unshift(this); // add to front

  // HACK: tool can't watch for double click so I'm getting the items to do it
  this.raster.onDoubleClick = function(event) {
    if (paper.tool == selectTool) {
      selectTool.onDoubleClick(event);
    }
  }
}
Annotation.prototype.toMask = function() {
  return imageDataToMask(this.raster.getImageData());
}
Annotation.prototype.delete = function() {
  annotations.splice(annotations.indexOf(this), 1 );
  this.raster.remove();
  this.boundary.remove();
  console.log("Deleted annotation.");
}
Annotation.prototype.translate = function(delta) {
  this.raster.translate(delta);
  this.boundary.translate(delta);
}
Annotation.prototype.scale = function(scale, center) {
  this.raster.scale(scale, center);
  this.boundary.scale(scale, center);
}
Annotation.prototype.highlight = function() {
  this.highlighted = true;
  this.raster.opacity = 0;
  if (this.boundary) {
    this.boundary.strokeColor = this.color;
    this.boundary.strokeWidth = 2;
  }
  console.log(this.name);
}
Annotation.prototype.unhighlight = function() {
  this.highlighted = false;
  this.raster.opacity = 0.7;
  if (this.boundary) {
    this.boundary.strokeWidth = 0;
  }
}
Annotation.prototype.setInvisible = function() {
  this.raster.opacity = 0;
  if (this.boundary) {
    this.boundary.strokeWidth = 0;
  }
}
Annotation.prototype.updateBoundary = function() {
  var newBoundary = makeBoundary(this.raster.getImageData());
  if (this.boundary) {
    newBoundary.style = this.boundary.style;
    this.boundary.remove();
    this.boundary = newBoundary;
  } else {
    newBoundary.strokeColor = "black";
    newBoundary.strokeWidth = 5;
    this.boundary = newBoundary;
  }
  console.log(this.boundary.area);

  if (this.boundary.area == 0) {
    this.delete();
    selectTool.switch();
  }

  // Sort annotation from smallest to largest.
  var changed = true;
  while (changed) {
    changed = false;
    for (var i = 0; i < annotations.length-1; i++) {
      var ann0 = annotations[i];
      var ann1 = annotations[i+1];
      if (Math.abs(ann0.boundary.area) > Math.abs(ann1.boundary.area)) {
        ann0.raster.insertBelow(ann1.raster);
        annotations[i+1] = ann0;
        annotations[i] = ann1;
        changed = true;
      }
    }
  }
}

Annotation.prototype.unite = function(shape) {
  editRaster(this.raster, shape, "unite", this.color);
}
Annotation.prototype.subtract = function(shape) {
  editRaster(this.raster, shape, "subtract", this.color);
}

function editRaster(raster, shape, rule, color) {
  var other = shape.clone();
  other.fillColor = "black";
  other.strokeWidth = 0;

  var otherRaster = other.rasterize(raster.resolution.height);
  if (otherRaster.height == 0 || otherRaster.width == 0) {
    other.remove();
    otherRaster.remove();
    return;
  }
  var topLeft = background.getPixel(otherRaster.bounds.point);
  var imageData0 = raster.getImageData();
  var imageData1 = otherRaster.getImageData();
  for (var x = 0; x < imageData1.width; x++) {
    for (var y = 0; y < imageData1.height; y++) {
      var pixel1 = new Point(x,y);
      var pixel0 = pixel1 + topLeft;
      var color1 = getColor(imageData1, pixel1);
      var color0 = getColor(imageData0, pixel0);
      if (color1.alpha != 0) {
        if (rule == "unite") {
          editColor(imageData0, pixel0, color);
        } else if (rule == "subtract") {
          editColor(imageData0, pixel0, new Color(0,0,0,0));
        } else if (rule == "flip") {
          if (color0.alpha == 0) {
            editColor(imageData0, pixel0, color);
          } else {
            editColor(imageData0, pixel0, new Color(0,0,0,0));
          }
        }
      }
    }
  }
  raster.setImageData(imageData0, new Point(0,0));

  other.remove();
  otherRaster.remove();
}
function getColor(imageData, pixel) {
  var p = (pixel.y * imageData.width + pixel.x) * 4;
  var color = new Color();
  color.red = imageData.data[p];
  color.green = imageData.data[p+1];
  color.blue = imageData.data[p+2];
  color.alpha = imageData.data[p+3];
  return color;
}
function editColor(imageData, pixel, color) {
  if (pixel.x < 0 || pixel.y < 0
    || pixel.x >= imageData.width || pixel.y >= imageData.height) {
    return;
  }
  var p = (pixel.y * imageData.width + pixel.x) * 4;
  imageData.data[p] = color.red*255;
  imageData.data[p+1] = color.green*255;
  imageData.data[p+2] = color.blue*255;
  imageData.data[p+3] = color.alpha*255;
}

//
// Utils
//

function makeBoundary(imageData) {
  var boundaries = findBoundariesOpenCV(imageData);
  var paths = [];
  for (var i = 0; i < boundaries.length; i++) {
    var path = [];
    for (var j = 0; j < boundaries[i].length; j++) {
      path.push(new Point(boundaries[i][j]));
    }
    paths.push(new Path({
      segments: path,
      closed: true
    }));
  }
  var compoundPath = new CompoundPath({
    children: paths
  });

  // Correct bottom right of boundary
  for (var i = 0; i < compoundPath.children.length; i++) {
    var path = compoundPath.children[i];
    for (var j = 0; j < path.segments.length; j++) {
      var point = path.segments[j].point;
      var right = new Point(point.x + 0.5, point.y);
      var down = new Point(point.x, point.y + 0.5);
      if ( ! compoundPath.contains(right)) {
        point.x += 0.95; // Prevents two points from becoming one point
      }
      if (! compoundPath.contains(down)) {
        point.y += 0.95;
      }
    }
  }
  background.toPointSpace(compoundPath);
  return compoundPath;
}

//
// Tools
//
var selectTool = new Tool();
selectTool.onMouseMove = function(event) {
  // Highlight top annotation. Unhighlight everything else.
  var topAnn = this.getTopMostAnnotation(event)
  for (var i = 0; i < annotations.length; i++) {
    var ann = annotations[i];
    if (ann == topAnn) {
      if ( ! ann.highlighted) {
        ann.highlight();
      }
    } else {
      if (ann.highlighted) {
        ann.unhighlight();
      }
    }
  }
}
selectTool.onDoubleClick = function(event) {
  var topAnn = this.getTopMostAnnotation(event)
  if (topAnn) {
    editTool.switch(topAnn);
  }
}
selectTool.getTopMostAnnotation = function(event) {
  for (var i = 0; i < annotations.length; i++) {
    if (annotations[i].boundary.contains(event.point)) {
      return annotations[i];
    }
  }
}
selectTool.onMouseDrag = function(event) {
  background.move(event.delta);
}
selectTool.onKeyDown = function(event) {
  if (event.key == 'n') {
    newTool.switch();
    return false;
  }
  if (event.key == '-') {
    background.scale(0.8);
    return false;
  }
  if (event.key == '=') {
    background.scale(1.25);
    return false;
  }
  if (event.key == 'f' || event.key == 'escape') {
    background.focus();
    return false;
  }
}
selectTool.deactivate = function() {
}
selectTool.switch = function() {
  paper.tool.deactivate();
  console.log("Switching to selectTool");

  for (var i = 0; i < annotations.length; i++) {
    annotations[i].unhighlight();
  }

  this.activate()
}

var editTool = new Tool();
editTool.onMouseMove = function(event) {
  this.curser.position = event.point;
  // Snap curser position to things
  if ( ! background.image.contains(this.curser.position)) {
    var edge = new Shape.Rectangle(background.image.bounds);
    var edgePath = edge.toPath();
    edge.remove();
    edgePath.remove();
    this.curser.position = edgePath.getNearestPoint(this.curser.position);
  }
  if (this.curser.intersects(this.points[0])) {
    this.curser.position = this.points[0].position;
    this.boundaryPointLine.visible = false;
  } else {
    this.boundaryPointLine.visible = true;
  }
  if (this.curser.intersects(this.boundaryPoint1)) {
    this.curser.position = this.boundaryPoint1.position;
  }
  if (this.curser.intersects(this.annotation.boundary)) {
    this.curser.position = this.annotation.boundary.getNearestPoint(event.point);
  }

  // Set this.boundaryPoint1
  if ( ! this.boundaryPoint1.fixed) {
    this.boundaryPoint1.position = this.annotation.boundary.getNearestPoint(this.curser.position);
  }

  // Set this.segment
  this.segment.remove();
  if (this.points.length == 0) {
    this.segment = new Path.Line(this.boundaryPoint1.position, this.curser.position);
    this.segment.style = this.path.style;
    this.segment.dashArray = [10, 4];
  } else {
    var lastPoint = this.points[this.points.length-1];
    this.segment = new Path.Line(lastPoint.position, this.curser.position);
    this.segment.style = this.path.style;
  }

  // Set mode
  if (this.points.length == 0) {
    var vector = this.segment.getPointAt(1);
    if ( ! this.annotation.boundary.contains(vector)) {
      this.mode = "unite";
    } else {
      this.mode = "subtract";
    }
  }

  // Set colors
  if (this.mode == "unite") {
    this.curser.fillColor = "#00FF00";
  } else {
    this.curser.fillColor = "red";
  }
  if (this.annotation.boundary.contains(this.curser.position)) {
    this.annotation.raster.opacity = 0.3
  } else {
    this.annotation.raster.opacity = 0
  }

  // Set up boundaryPoint2 and boundaryLine
  if (this.boundaryPoint1.fixed) {
    this.boundaryLine.remove();
    this.boundaryLine = new Path();
    this.boundaryPoint2.position = new Point(0,0);

    var intersections = this.annotation.boundary.getIntersections(this.segment);
    for (var i = 0; i < intersections.length; i++) {
      if (intersections[i].point == this.segment.firstSegment.point) {
        continue;
      }

      var bl = this.getPathUsingBoundary(intersections[i].point, this.boundaryPoint1.position);
      if (bl != null) {
        if (bl.length < this.boundaryLine.length || this.boundaryLine.length == 0) {
          this.boundaryLine.remove();
          this.boundaryLine = bl;
          this.boundaryLine.style = this.path.style;
          this.boundaryLine.dashArray = [10, 4];

          this.boundaryPoint2.position = intersections[i].point;
        } else {
          bl.remove();
        }
      }
    }
  }

  // Do not allow path to cross
  if (this.path.getIntersections(this.segment).length > 1) {
    this.segment.strokeColor = "red";
  }
}
editTool.onMouseDown = function(event) {
  this.onMouseMove(event);

  if ( ! this.boundaryPoint1.fixed) {
    this.boundaryPoint1.fixed = true;
    this.boundaryPoint1.position = this.annotation.boundary.getNearestPoint(this.curser.position);
    if ( ! this.annotation.boundary.intersects(this.curser)) {
      // Normal
      if (this.points.length == 0) {
        this.boundaryPointLine = this.segment.clone();
      }
      this.points.push(this.curser.clone());
      this.path.add(this.curser.position);
    }
  } else {
    // Add if segment valid
    if (this.segment.strokeColor != "red") {
      if (this.annotation.boundary.intersects(this.boundaryPoint2)) {
        // Autocomplete with boundary and edit
        this.path.add(this.boundaryPoint2.position);
        this.path.join(this.boundaryLine);
        this.path.closed = true;
        this.editAnnotation();

        editTool.switch(this.annotation);
        editTool.onMouseMove(event);

      } else if (this.curser.intersects(this.points[0])) {
        if (this.points.length != 1) {
          // Close path and edit
          this.path.closed = true;
          this.editAnnotation();

          editTool.switch(this.annotation);
          editTool.onMouseMove(event);
        }
      } else {
        // Add point
        if (this.points.length == 0) {
          this.boundaryPointLine = this.segment.clone();
        }
        this.points.push(this.curser.clone());
        this.path.add(this.curser.position);
      }
    }
  }
}
editTool.onMouseDrag = function(event) {
  if (this.points.length <= 1) {
    brushTool.switch(this.annotation);
    brushTool.onMouseMove(event);
  }
}
editTool.editAnnotation = function() {
  if (this.mode == "subtract") {
    this.annotation.subtract(this.path);
  } else {
    this.annotation.unite(this.path);
  }
  this.annotation.updateBoundary();
  this.path.remove();
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
editTool.undo = function() {
  if (this.points.length > 0) {
    this.segment.remove();
    this.path.removeSegment(this.points.length);
    this.path.removeSegment(this.points.length-1);
    this.points.pop().remove();
    if (this.points.length == 0) {
      this.boundaryPoint1.fixed = false;
      this.boundaryPointLine.remove();
    }
    return true;
  } else {
    return false;
  }
}
editTool.deactivate = function() {
  for (var i = 0; i < this.points.length; i++) {
    this.points[i].remove();
  }
  this.path.remove();
  this.segment.remove();
  this.curser.remove();
  this.boundaryPoint1.remove();
  this.boundaryPoint2.remove();
  this.boundaryLine.remove();
  this.boundaryPointLine.remove();
  this.annotation.unhighlight();
}
editTool.switch = function(annotation) {
  console.log("Switching to editTool");
  paper.tool.deactivate();

  this.annotation = annotation;
  for (var i = 0; i < annotations.length; i++) {
    annotations[i].setInvisible();
  }
  this.annotation.highlight();

  this.curser = new Shape.Circle({
    center: new Point(0,0),
    radius: 4
  });
  this.boundaryPoint1 = this.curser.clone();
  this.boundaryPoint2 = this.curser.clone();
  this.boundaryLine = new Path();
  this.boundaryPointLine = new Path();

  this.points = [];
  this.path = new Path();
  this.segment = new Path();

  this.curser.fillColor = "#00FF00";
  this.annotation.boundary.strokeColor = "gold";
  this.boundaryPoint1.fillColor = "gold";
  this.boundaryPoint2.fillColor = "gold";
  this.path.strokeColor = "black";
  this.path.strokeWidth = 3;

  this.activate();
}
editTool.onKeyDown = function(event) {
  event.point = this.curser.position;
  if (event.key == 'escape') {
    if (this.boundaryPoint1.fixed) {
      editTool.switch(this.annotation);
    } else {
      selectTool.switch();
    }
    return false;
  }
  if (event.key == 'backspace') {
    var undoed = this.undo();
    if ( ! undoed) {
      this.annotation.delete();
      selectTool.switch();
    }
    return false;
  }
  if (event.key == 'space') {
    this.onMouseDown(event);
    return false;
  }
  if (event.key == '-') {
    if ( ! this.boundaryPoint1.fixed) {
      background.scale(0.8);
      this.onMouseMove(event);
      return false;
    }
  }
  if (event.key == '=') {
    if ( ! this.boundaryPoint1.fixed) {
      background.scale(1.25);
      this.onMouseMove(event);
      return false;
    }
  }
  if (event.key == 'f') {
    if ( ! this.boundaryPoint1.fixed) {
      background.focus(this.annotation);
      this.onMouseMove(event);
    }
    return false;
  }
}

var brushTool = new Tool();
brushTool.onMouseMove = function(event) {
  this.brush.position = event.point;
  if (this.annotation.boundary.contains(this.brush.position)) {
    this.mode = "unite";
    this.brush.fillColor = "#00FF00";
  } else {
    this.mode = "subtract";
    this.brush.fillColor = "red";
  }
}
brushTool.onMouseDrag = function(event) {
  this.brush.position = event.point;
  if (this.mode == "unite") {
    this.annotation.unite(this.brush);
  } else {
    this.annotation.subtract(this.brush);
  }
}
brushTool.onMouseUp = function(event) {
  this.annotation.updateBoundary();

  if (this.annotation.boundary.area != 0) {
    editTool.switch(this.annotation);
    editTool.onMouseMove(event);
  }
}
brushTool.deactivate = function() {
  this.brush.remove();
}
brushTool.switch = function(annotation) {
  console.log("Switching to brushTool");
  paper.tool.deactivate();

  this.brush = new Shape.Circle({
      center: [0, 0],
      radius: 15
    });

  this.annotation = annotation;
  this.annotation.unhighlight();

  this.activate();
}
brushTool.onKeyDown = function(event) {
  if (event.key == '-') {
    background.scale(0.8);
    return false;
  }
  if (event.key == '=') {
    background.scale(1.25);
    return false;
  }
}

var newTool = new Tool();
newTool.onMouseMove = function(event) {
  this.curser.position = event.point;

  if (this.points.length != 0) {
    this.path.removeSegment(this.points.length);
    this.path.add(this.curser.position);
  }
}
newTool.onMouseDown = function(event) {
  this.curser.position = event.point;
  
  this.points.push(this.curser.clone());
  this.path.add(this.curser.position);

  if (this.points.length > 1) {
    if (this.points[0].position.getDistance(this.curser.position) < 10) {
      this.path.closed = true;
      this.createAnnotation();
    }
  }
}
newTool.createAnnotation = function() {
  var mask = nj.zeros([background.image.height, background.image.width]);
  var annotation = new Annotation(mask, this.name);
  annotation.unite(this.path);
  annotation.updateBoundary();
  annotation.unhighlight();

  this.path.remove();
  selectTool.switch();
}

newTool.undo = function() {
  if (this.points.length > 0) {
    this.path.removeSegment(this.points.length);
    this.path.removeSegment(this.points.length-1);
    this.points.pop().remove();
  }
}
newTool.requestName = function() {
    var name = prompt("Please enter object name.", "");
    return name;
}
newTool.deactivate = function() {
  for (var i=0; i < this.points.length; i++) {
    this.points[i].remove();
  }

  this.curser.remove();
}
newTool.switch = function () {
  paper.tool.deactivate();
  console.log("Switching to newTool");

  // Prompt for object name.
  this.name = this.requestName();
  if (this.name == null || this.name == "") {
    selectTool.switch();
  } else {
    this.points = [];
    this.path = new Path();
    this.path.strokeWidth = 3;
    this.path.strokeColor = 'blue';

    this.curser = new Shape.Circle({
      radius: 5,
      strokeColor: 'red',
      strokeWidth: 3
    });

    this.activate();
  }
}
newTool.onKeyDown = function(event) {
  if (event.key == 'escape') {
    selectTool.switch();
    return false;
  }
  if (event.key == 'backspace') {
    this.undo();
    return false;
  }
}