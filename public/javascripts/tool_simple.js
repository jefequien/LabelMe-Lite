/**
 * Annotation tool powered by PaperJS.
 * This tool has many features removed.
 */

window.setUpTool = function(task) {
  var image_url = task["image_url"];
  background.image = new Raster(image_url);
  background.image.onLoad = function() {
    background.focus();
    loadAnnotations(task);
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
}


var background = new Background();
var annotations = [];

function loadAnnotations(task) {
  var data = task["annotations"];
  for (var i = 0; i < data.length; i++) {
    var category = data[i]["category"];
    var segmentation = data[i]["segmentation"];
    loadAnnotation(segmentation, category);
  }
}

function loadAnnotation(segmentation, name) {
  var image = new Image();
  image.src = segmentation;
  image.onload = function() {
    var mask = nj.images.read(image);
    var annotation = new Annotation(mask, name);

    background.max_height = 200;
    background.max_width = 200;
    background.focus(annotation);
    background.fixed = true;
    editTool.switch(annotation);
  }
}

function saveAnnotations() {
  var payload = {};
  var data = [];
  for (var i = 0; i < annotations.length; i++) {
    var ann = saveAnnotation(annotations[i]);
    data.push(ann);
  }

  payload["annotations"] = data;
  postAnnotations(payload);
}

function saveAnnotation(annotation) {
  var mask = annotation.toMask();
  // Serialize into img
  var ann = {};
  ann["mask"] = mask;
  ann["name"] = annotation.name;
  return ann;
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
  if ( ! this.fixed) {
    this.image.scale(ratio, this.center);
    for (var i = 0; i < annotations.length; i++){
        annotations[i].scale(ratio, this.center);
    }
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
  if ( ! this.image) {
    return null;
  }
  var bounds = this.image.bounds;
  var ratio = bounds.height / this.image.height;
  var pixelX = Math.round((point.x - bounds.x) / ratio);
  var pixelY = Math.round((point.y - bounds.y) / ratio);
  return new Point(pixelX, pixelY);
}
Background.prototype.getPoint = function(pixel) {
  if ( ! this.image) {
    return null;
  }
  var bounds = this.image.bounds;
  var ratio = bounds.height / this.image.height;
  var pointX = pixel.x * ratio + bounds.x;
  var pointY = pixel.y * ratio + bounds.y;
  return new Point(pointX, pointY);
}

function Annotation(shapeOrMask, name){
  this.name = name;
  this.color = new Color(Math.random(), Math.random(), Math.random(), 1);

  if (shapeOrMask.shape) {
    this.raster = this.createFromMask(shapeOrMask);
  } else{
    this.raster = this.createFromShape(shapeOrMask);
  }
  this.id = this.raster.id;
  this.updateBoundary();

  // Insert annotation sorted from smallest to largest.
  for (var i = 0; i < annotations.length; i++) {
    if (this.boundary.area > annotations[i].boundary.area) {
      this.raster.insertAbove(annotations[i].raster);
      annotations.splice(i, 0, this);
      break;
    }
  }
  if ( ! annotations.includes(this)) {
    annotations.push(this);
  }

  this.highlight();
  this.unhighlight();

  // HACK: tool can't watch for double click so I'm getting the items to do it
  this.raster.onDoubleClick = function(event) {
    if (paper.tool == selectTool) {
      selectTool.onDoubleClick(event);
    }
  }
}

Annotation.prototype.createFromMask = function(mask) {
  // Mask to raster
  var r = nj.multiply(mask, this.color.red);
  var g = nj.multiply(mask, this.color.green);
  var b = nj.multiply(mask, this.color.blue);
  var a = mask;
  var color_mask = nj.stack([r, g, b, a], -1);

  imageData = arrayToImageData(color_mask);
  var raster = background.getBlank();
  raster.setImageData(imageData, new Point(0, 0));
  return raster;
}
Annotation.prototype.createFromShape = function(shape) {
    this.raster = background.getBlank();
    this.unite(shape);
    shape.remove();
    return this.raster;
}
Annotation.prototype.toMask = function() {
  var imageData = this.raster.getImageData();
  var array = imageDataToArray(imageData);
  var mask = array.slice(null,null,3);
  return mask;
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
  if ( ! this.highlighted) {
    this.highlighted = true;
    this.raster.opacity = 0.3;
    this.boundary.strokeColor = "black";
    this.boundary.strokeWidth = 2;
    // this.boundary.selected = true;
    console.log(this.name);
  }
}
Annotation.prototype.unhighlight = function() {
  if (this.highlighted) {
    this.highlighted = false;
    this.raster.opacity = 0.7;
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
}
Annotation.prototype.delete = function() {
  annotations.splice(annotations.indexOf(this), 1 );
  this.raster.remove();
  this.boundary.remove();
  console.log("Deleted annotation.");
}

Annotation.prototype.unite = function(shape) {
  editRaster(this.raster, shape, "unite", this.color);
  shape.remove();
}
Annotation.prototype.subtract = function(shape) {
  editRaster(this.raster, shape, "subtract", this.color);
  shape.remove();
}

function editRaster(raster, shape, rule, color) {
  var other = shape.clone();
  other.fillColor = "black";
  // Hack!!! Overestimate. Need to adjust pixels later.
  if (rule == "subtract") {
    other.strokeWidth = 5;
    other.strokeColor = "black";
  }
  var otherRaster = other.rasterize(raster.resolution.height);
  if (otherRaster.height == 0 || otherRaster.width == 0) {
    other.remove();
    otherRaster.remove();
    return;
  }
  var imageData0 = raster.getImageData();
  var imageData1 = otherRaster.getImageData();
  var topLeft = background.getPixel(otherRaster.bounds.point);
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

function arrayToImageData(array) {
  var cv = document.createElement('canvas');
  var ctx = cv.getContext('2d');
  cv.height = array.shape[0];
  cv.width = array.shape[1];
  nj.images.save(array, cv);
  image_data = ctx.getImageData(0,0,array.shape[1], array.shape[0]);
  return image_data;
}

function imageDataToArray(imageData) {
  var h = imageData.height;
  var w = imageData.width;
  var array = nj.array(Array.from(imageData.data));
  var array = array.reshape([h,w,4]);
  return array;
}

function makeBoundary(imageData) {
  var boundaries = findBoundariesOpenCV(imageData);
  var paths = [];
  for (var i = 0; i < boundaries.length; i++) {
    var points = [];
    for (var j = 0; j < boundaries[i].length; j++) {
      var pixel = new Point(boundaries[i][j]);
      var point = background.getPoint(pixel);
      points.push(point);
    }
    paths.push(new Path({
      segments: points,
      closed: true
    }));
  }
  var shape = new CompoundPath({
    children: paths
  });
  return shape;
}

function findBoundariesOpenCV(imageData) {
  var src = cv.matFromImageData(imageData);
  var dst = cv.Mat.zeros(src.cols, src.rows, cv.CV_8UC3);
  cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
  cv.threshold(src, src, 1, 255, cv.THRESH_BINARY);
  var contours = new cv.MatVector();
  var hierarchy = new cv.Mat();
  // // You can try more different parameters
  cv.findContours(src, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

  var boundaries = [];
  for (var i = 0; i < contours.size(); i++) {
    var cnt = contours.get(i);
    var bnd = [];
    for (var j = 0; j < cnt.rows; j++) {
      bnd.push([cnt.data32S[j*2], cnt.data32S[j*2+1]])
    }
    boundaries.push(bnd);
    cnt.delete();
  }
  src.delete();
  dst.delete();
  contours.delete();
  hierarchy.delete();
  return boundaries;
}

//
// Tools
//
var selectTool = new Tool();
selectTool.curser = new Shape.Circle(new Point(0, 0), 0);
selectTool.onMouseMove = function(event) {
  // Highlight top annotation. Unhighlight everything else.
  var topAnn = this.getTopMostAnnotation(event)
  for (var i = 0; i < annotations.length; i++) {
    if (annotations[i] == topAnn) {
      annotations[i].highlight();
    } else {
      annotations[i].unhighlight();
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
  if (event.key == '9') {
    background.scale(0.8);
    return false;
  }
  if (event.key == '0') {
    background.scale(1.25);
    return false;
  }
  if (event.key == 'f' || event.key == 'escape') {
    background.focus();
    return false;
  }
}
selectTool.deactivate = function() {
  this.curser.remove();
}
selectTool.switch = function() {
  paper.tool.deactivate();
  console.log("Switching to selectTool");
  this.activate()
}

var editTool = new Tool();
editTool.onMouseMove = function(event) {
  this.curser.position = event.point;

  if (this.mode == "unite") {
    this.curser.fillColor = "#00FF00";
  } else {
    this.curser.fillColor = "red";
  }

  // Snap curser to things
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

  // Set boundaryPoint1
  if ( ! this.boundaryPoint1.fixed) {
    this.boundaryPoint1.position = this.annotation.boundary.getNearestPoint(this.curser.position);
  }

  // Set segment
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

  if (this.boundaryPoint1.fixed) {
    // Set up boundaryPoint2 and boundaryLine
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

  // Do not allow to cross
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
        // Autocomplete with boundary
        this.path.add(this.boundaryPoint2.position);
        this.path.join(this.boundaryLine);
        this.path.closed = true;
        this.editAnnotation();

        // Persist
        var persist = this.boundaryPoint2.position;
        editTool.switch(this.annotation);
        editTool.boundaryPoint1.fixed = true;
        editTool.boundaryPoint1.position = this.annotation.boundary.getNearestPoint(persist);

      } else if (this.curser.intersects(this.points[0])) {
        // Path is closed
        this.path.closed = true;
        this.editAnnotation();
        editTool.switch(this.annotation);
      } else {
        // Normal
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
    rectTool.switch(this.annotation);
    rectTool.onMouseDown(event);
  }
}
editTool.editAnnotation = function() {
  if (this.mode == "subtract") {
    this.annotation.subtract(this.path);
  } else {
    this.annotation.unite(this.path);
  }
  this.annotation.updateBoundary();
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

  this.curser = new Shape.Circle({
    center: new Point(0,0),
    radius: 4
  });
  this.boundaryPoint1 = this.curser.clone();
  this.boundaryPoint2 = this.curser.clone();
  this.boundaryLine = new Path();
  this.boundaryPointLine = new Path();

  this.annotation = annotation;
  this.annotation.highlight();
  this.points = [];
  this.path = new Path();
  this.segment = new Path();

  this.curser.fillColor = "#00FF00";
  this.boundaryPoint1.fillColor = "gold";
  this.boundaryPoint2.fillColor = "gold";
  this.annotation.boundary.strokeColor = "gold";
  this.path.strokeColor = "black";
  this.path.strokeWidth = 3;

  this.activate();
}
editTool.onKeyDown = function(event) {
  if (event.key == 'escape') {
    if (this.boundaryPoint1.fixed) {
      editTool.switch(this.annotation);
    } else {
      selectTool.switch();
    }
    return false;
  }
  if (event.key == 'backspace') {
    var success = this.undo();
    if ( ! success) {
      this.annotation.delete();
      selectTool.switch();
    }
    return false;
  }
  if (event.key == 'space') {
    event.point = this.curser.position;
    this.onMouseDown(event);
    return false;
  }
}

var rectTool = new Tool();
rectTool.onMouseDown = function(event) {
  this.anchor = event.point;
  if (this.annotation.boundary.contains(this.anchor)) {
    this.mode = "unite";
  } else {
    this.mode = "subtract";
  }
}
rectTool.onMouseDrag = function(event) {
  this.rectangle.remove();
  this.rectangle = new Shape.Rectangle(this.anchor, event.point);
  if (this.mode == "unite") {
    this.rectangle.strokeColor = "#00FF00";
  } else {
    this.rectangle.strokeColor = "red";
  }
  this.rectangle.strokeWidth = 3;
}
rectTool.onMouseUp = function(event) {
  if (this.mode == "unite") {
    this.annotation.unite(this.rectangle);
  } else {
    this.annotation.subtract(this.rectangle);
  }
  this.annotation.updateBoundary();

  editTool.switch(this.annotation);
  editTool.onMouseMove(event);
}
rectTool.deactivate = function() {
  this.rectangle.remove();
  this.annotation.unhighlight();
}
rectTool.switch = function(annotation) {
  console.log("Switching to rectTool");
  paper.tool.deactivate();

  this.annotation = annotation;
  this.annotation.highlight();
  this.annotation.boundary.strokeColor = "gold";

  this.rectangle = new Shape.Rectangle();
  this.activate();
}