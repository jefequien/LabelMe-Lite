/**
 * Annotation tool powered by PaperJS.
 */
var annotations = [];

function Annotation(mask, name){
  this.name = name;
  this.color = new Color(Math.random(), Math.random(), Math.random(), 1);

  this.raster = new Raster({
      size: {
          width: mask.shape[1],
          height: mask.shape[0]
      }
  });
  this.raster.setImageData(maskToImageData(mask, this.color), new Point(0, 0));
  this.id = this.raster.id;

  annotations.unshift(this); // add to front
  tree.addAnnotation(this);

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
  tree.deleteAnnotation(this);
  this.raster.remove();
  this.boundary.remove();
  console.log("Deleted annotation.");
}
Annotation.prototype.translate = function(delta) {
  this.raster.translate(delta);
  if (this.boundary) {
    this.boundary.translate(delta);
  }
}
Annotation.prototype.scale = function(scale, center) {
  this.raster.scale(scale, center);
  if (this.boundary) {
    this.boundary.scale(scale, center);
  }
}
Annotation.prototype.highlight = function() {
  this.highlighted = true;
  this.raster.opacity = 0;
  if (this.boundary) {
    this.boundary.strokeColor = this.color;
    this.boundary.strokeWidth = 2;
  }
  tree.setActive(this, true);
  console.log(this.name);
}
Annotation.prototype.unhighlight = function() {
  this.highlighted = false;
  this.raster.opacity = 0.7;
  if (this.boundary) {
    this.boundary.strokeWidth = 0;
  }
  tree.setActive(this, false);
}
Annotation.prototype.setInvisible = function() {
  this.raster.opacity = 0;
  if (this.boundary) {
    this.boundary.strokeWidth = 0;
  }
}
Annotation.prototype.getPixel = function(point) {
  var bounds = this.raster.bounds;
  var scale = bounds.height / this.raster.height;
  var pixelX = (point.x - bounds.left) / scale - 0.5;
  var pixelY = (point.y - bounds.top) / scale - 0.5;
  return new Point(Math.round(pixelX), Math.round(pixelY));
}
Annotation.prototype.getPoint = function(pixel) {
  var bounds = this.raster.bounds;
  var scale = bounds.height / this.raster.height;
  var pointX = (pixel.x + 0.5) * scale + bounds.left;
  var pointY = (pixel.y + 0.5) * scale + bounds.top;
  return new Point(pointX, pointY);
}
Annotation.prototype.toPixelSpace = function(shape) {
  var delta = this.raster.bounds.topLeft;
  var scale = this.raster.height / this.raster.bounds.height;
  shape.translate(-delta);
  shape.scale(scale, new Point(0,0));
  shape.translate(new Point(-0.5,-0.5));
}
Annotation.prototype.toPointSpace = function(shape) {
  var delta = this.raster.bounds.topLeft;
  var scale = this.raster.bounds.height / this.raster.height;
  shape.translate(new Point(0.5,0.5));
  shape.scale(scale, new Point(0,0));
  shape.translate(delta);
}
Annotation.prototype.updateBoundary = function() {
  var boundary = makeBoundary(this.raster.getImageData());

  // Move from pixel space to point space
  boundary.translate(new Point(0.5, 0.5));
  var scale = this.raster.bounds.height / this.raster.height;
  boundary.translate(this.raster.bounds.topLeft);
  boundary.scale(scale, this.raster.bounds.topLeft);

  // Preserve boundary style
  if (this.boundary) {
    boundary.style = this.boundary.style;
    this.boundary.remove();
    this.boundary = boundary;
  } else {
    boundary.strokeColor = "black";
    boundary.strokeWidth = 5;
    this.boundary = boundary;
  }

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
  this.edit(shape, "unite");
}
Annotation.prototype.subtract = function(shape) {
  this.edit(shape, "subtract");
}
Annotation.prototype.edit = function(shape, rule) {
  var shape_pixel = shape.clone();
  this.toPixelSpace(shape_pixel);
  shape_pixel.fillColor = "black";
  shape_pixel.remove();

  var tl = this.getPixel(shape.bounds.topLeft);
  var br = this.getPixel(shape.bounds.bottomRight);
  var imageData = this.raster.getImageData();
  for (var x = tl.x; x <= br.x; x++) {
    for (var y = tl.y; y <= br.y; y++) {
      var pixel = new Point(x,y)
      var options = {fill: true, tolerance: 0.5};
      if (shape_pixel.contains(pixel) || shape_pixel.hitTest(pixel, options)) {
        if (rule == "unite") {
          editColor(imageData, pixel, this.color);
        } else if (rule == "subtract") {
          editColor(imageData, pixel, new Color(0,0,0,0));
        }
      }
    }
  }
  this.raster.setImageData(imageData, new Point(0,0));
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
function makeBoundary(imageData) {
  var paths = [];
  var boundaries = findBoundariesOpenCV(imageData);
  for (var i = 0; i < boundaries.length; i++) {
    var path = new Path({
      segments: boundaries[i],
      closed: true
    });
    paths.push(path);
  }
  var paths = new CompoundPath({
    children: paths
  });
  return paths;
}

//
// Exports
//
function loadAnnotations(anns) {
  for (var i = 0; i < anns.length; i++) {
    var category = anns[i]["category"];
    var rle = anns[i]["segmentation"];
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

window.Annotation = Annotation;
window.annotations = annotations;
window.loadAnnotations = loadAnnotations;
window.saveAnnotations = saveAnnotations;
