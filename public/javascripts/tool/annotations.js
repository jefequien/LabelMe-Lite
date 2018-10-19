/**
 * Annotation tool powered by PaperJS.
 */
function Annotation(name, mask){
  this.name = name;
  this.color = new Color(Math.random(), Math.random(), Math.random(), 1);

  this.boundary = new CompoundPath();
  this.mask = mask;
  if (this.mask == null) {
    this.mask = nj.zeros([background.image.height, background.image.width]);
  }
  this.raster = new Raster({size: new Size(this.mask.shape[1], this.mask.shape[0])});
  this.updateRaster();

  this.id = this.raster.id;
  annotations.unshift(this); // add to front
  tree.addAnnotation(this);
}
Annotation.prototype.refresh = function() {
  this.updateBoundary();
  this.updateMask();
  sortAnnotations();

  if (this.boundary.area == 0) {
    this.delete();
    selectTool.switch();
  }
}
Annotation.prototype.updateBoundary = function() {
  var imageData = this.raster.getImageData();
  var boundaries = findBoundariesOpenCV(imageData);
  var paths = [];
  for (var i = 0; i < boundaries.length; i++) {
    var path = new Path({
      segments: boundaries[i],
      closed: true
    });
    paths.push(path);
  }
  var boundary = new CompoundPath({ children: paths });
  boundary.remove();

  this.toPointSpace(boundary);
  this.boundary.pathData = boundary.pathData;
}
Annotation.prototype.updateMask = function() {
  var imageData = this.raster.getImageData();
  var mat = cv.matFromImageData(imageData);
  var array = matToArray(mat);
  var mask = array.slice(null,null,3);
  if (nj.max(this.mask) > 1) {
    mask = mask.divide(nj.max(mask));
  }
  this.mask = mask;
}
Annotation.prototype.updateRaster = function() {
  var mask = this.mask.multiply(255);
  var r = nj.multiply(mask, this.color.red);
  var g = nj.multiply(mask, this.color.green);
  var b = nj.multiply(mask, this.color.blue);
  var a = mask;
  var color_mask = nj.stack([r, g, b, a], -1);
  var imageData = arrayToImageData(color_mask);

  this.raster.setImageData(imageData, new Point(0, 0));
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
  this.boundary.translate(delta);
}
Annotation.prototype.scale = function(scale, center) {
  this.raster.scale(scale, center);
  this.boundary.scale(scale, center);
}
Annotation.prototype.highlight = function() {
  this.highlighted = true;
  this.raster.opacity = 0;
  this.boundary.strokeColor = this.color;
  this.boundary.strokeWidth = 2;

  tree.setActive(this, true);
  console.log(this.name);
}
Annotation.prototype.unhighlight = function() {
  this.highlighted = false;
  this.raster.opacity = 0.7;
  this.boundary.strokeWidth = 0;

  tree.setActive(this, false);
}
Annotation.prototype.hide = function() {
  this.raster.opacity = 0;
  this.boundary.strokeWidth = 0;
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
Annotation.prototype.unite = function(shape) {
  this.edit(shape, "unite");
}
Annotation.prototype.subtract = function(shape) {
  this.edit(shape, "subtract");
}
Annotation.prototype.edit = function(shape, rule) {
  var imageData = this.raster.getImageData();
  var color = new Color(0,0,0,0);
  if (rule == "unite") {
    color = this.color;
  }

  var shape_pixel = shape.clone();
  this.toPixelSpace(shape_pixel);
  shape_pixel.remove();

  // Edit boundary pixels
  for (var i = 0; i < shape_pixel.segments.length; i++) {
    var pixel = shape_pixel.segments[i].point;
    editPixel(imageData, pixel, color);
  }

  // Edit interior pixels
  var tl = this.getPixel(shape.bounds.topLeft);
  var br = this.getPixel(shape.bounds.bottomRight);
  for (var x = tl.x; x <= br.x; x++) {
    for (var y = tl.y; y <= br.y; y++) {
      var pixel = new Point(x,y);
      if (shape_pixel.contains(pixel)) {
        editPixel(imageData, pixel, color);
      }
    }
  }

  this.raster.setImageData(imageData, new Point(0,0));
}
function editPixel(imageData, pixel, color) {
  var x = Math.round(pixel.x);
  var y = Math.round(pixel.y);
  if (x < 0 || y < 0
    || x >= imageData.width || y >= imageData.height) {
    return;
  }
  var p = (y * imageData.width + x) * 4;
  imageData.data[p] = color.red*255;
  imageData.data[p+1] = color.green*255;
  imageData.data[p+2] = color.blue*255;
  imageData.data[p+3] = color.alpha*255;
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

//
// Exports
//
function loadAnnotations(anns) {
  for (var i = 0; i < anns.length; i++) {
    var category = anns[i]["category"];
    var rle = anns[i]["segmentation"];
    var mask = rleToMask(rle);
    var annotation = new Annotation(category, mask);
    annotation.refresh();
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

function sortAnnotations() {
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

window.Annotation = Annotation;
window.annotations = [];
window.loadAnnotations = loadAnnotations;
window.saveAnnotations = saveAnnotations;
