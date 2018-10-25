/**
 * Annotation tool powered by PaperJS.
 */
 
function Annotation(name, mask){
  console.time(name);
  this.name = name;
  this.color = new Color(Math.random(), Math.random(), Math.random(), 1);

  this.mask = mask;
  if (this.mask == null) {
    this.mask = nj.zeros([background.image.height, background.image.width]);
  }

  this.raster = new Raster({size: new Size(this.mask.shape[1], this.mask.shape[0])});
  this.rasterinv = this.raster.clone();
  this.rasterinv.visible = false;
  this.id = this.raster.id;

  this.boundary = new CompoundPath();
  this.boundaryPixels = [];

  setRaster(this.raster, this.color, this.mask);

  annotations.unshift(this); // add to front
  background.align(this);
  tree.addAnnotation(this);
  this.unhighlight();
  console.timeEnd(name);
}
Annotation.prototype.updateBoundary = function() {
  var imageData = this.raster.getImageData();
  var boundaries = findBoundariesOpenCV(imageData);

  this.boundaryPixels = [];
  var paths = [];
  for (var i = 0; i < boundaries.length; i++) {
    var path = new Path({
      segments: boundaries[i],
      closed: true
    });
    paths.push(path);
    this.boundaryPixels = this.boundaryPixels.concat(boundaries[i]);
  }

  var paths = new CompoundPath({children: paths});
  background.toPointSpace(paths);
  this.boundary.pathData = paths.pathData;
  
  if (this.boundary.area == 0) {
    this.delete();
    selectTool.switch();
  }
}
Annotation.prototype.updateMask = function() {
  var imageData = this.raster.getImageData();
  var mat = cv.matFromImageData(imageData);
  var array = matToArray(mat);
  var mask = array.slice(null,null,3);
  mask = mask.reshape(mask.shape[0], mask.shape[1]);
  mask = mask.divide(nj.max(mask));
  this.mask = mask;
}
Annotation.prototype.refresh = function() {
  this.updateMask();
  this.updateBoundary();
  sortAnnotations();

  var maskinv = nj.add(nj.multiply(this.mask, -1), 1);
  setRaster(this.rasterinv, this.color, maskinv);
}
Annotation.prototype.delete = function() {
  this.raster.remove();
  this.boundary.remove();
  annotations.splice(annotations.indexOf(this), 1);
  tree.deleteAnnotation(this);
  console.log("Deleted annotation.");
}

//
// Transform
//
Annotation.prototype.translate = function(delta) {
  this.raster.translate(delta);
  this.rasterinv.translate(delta);
  this.boundary.translate(delta);
}
Annotation.prototype.scale = function(scale, center) {
  this.raster.scale(scale, center);
  this.rasterinv.scale(scale, center);
  this.boundary.scale(scale, center);
}

//
// Styles
//
Annotation.prototype.highlight = function() {
  if ( ! this.highlighted) {
    console.log(this.name);
  }
  this.highlighted = true;
  this.raster.opacity = 0.2;
  this.boundary.strokeColor = this.color;
  this.boundary.strokeWidth = 3;

  tree.setActive(this, true);
}
Annotation.prototype.unhighlight = function() {
  this.highlighted = false;
  this.raster.opacity = 0.7;
  this.boundary.strokeColor = this.color;
  this.boundary.strokeWidth = 0;

  tree.setActive(this, false);
}
Annotation.prototype.hide = function() {
  this.highlighted = false;
  this.raster.opacity = 0;
  this.boundary.strokeWidth = 0;
}

//
// Edit raster
//
Annotation.prototype.unite = function(shape) {
  var pixels = getPixels(shape);
  editRaster(this.raster, this.color, pixels);
  editRaster(this.rasterinv, new Color(0,0,0,0), pixels);
}
Annotation.prototype.subtract = function(shape) {
  var pixels = getPixels(shape);
  editRaster(this.raster, new Color(0,0,0,0), pixels);
  editRaster(this.rasterinv, this.color, pixels);
}
Annotation.prototype.intersects = function(shape) {
  var pixels = getPixels(shape);
  for (var i = 0; i < pixels.length; i++) {
    if (this.containsPixel(pixels[i])) {
      return true;
    }
  }
  return false;
}
Annotation.prototype.containsPixel = function(pixel) {
  var color = this.raster.getPixel(pixel);
  return color.alpha != 0;
}
function setRaster(raster, color, mask) {
  var mask = mask.multiply(255);
  var r = nj.multiply(mask, color.red);
  var g = nj.multiply(mask, color.green);
  var b = nj.multiply(mask, color.blue);
  var a = mask;
  var color_mask = nj.stack([r, g, b, a], -1);
  var imageData = arrayToImageData(color_mask);

  raster.setImageData(imageData, new Point(0, 0));
}
function editRaster(raster, color, pixels) {
  var imageData = raster.getImageData();
  for (var i = 0; i < pixels.length; i++) {
    setPixelColor(imageData, pixels[i], color);
  }
  raster.setImageData(imageData, new Point(0,0));
}
function setPixelColor(imageData, pixel, color) {
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
function getPixelColor(imageData, pixel) {
  var x = Math.round(pixel.x);
  var y = Math.round(pixel.y);
  var p = (y * imageData.width + x) * 4;
  var color = new Color();
  color.red = imageData.data[p];
  color.green = imageData.data[p+1];
  color.blue = imageData.data[p+2];
  color.alpha = imageData.data[p+3];
  return color;
}
function getPixels(shape) {
  var shape_pixel = shape.clone();
  shape_pixel.remove();
  background.toPixelSpace(shape_pixel);

  var pixels = [];
  // Boundary pixels
  for (var i = 0; i < shape_pixel.length; i++) {
    pixels.push(shape_pixel.getPointAt(i));
  }
  // Interior pixels
  var tl = background.getPixel(shape.bounds.topLeft);
  var br = background.getPixel(shape.bounds.bottomRight);
  for (var x = tl.x; x <= br.x; x++) {
    for (var y = tl.y; y <= br.y; y++) {
      var pixel = new Point(x,y);
      if (shape_pixel.contains(pixel)) {
        pixels.push(pixel);
      }
    }
  }
  return pixels;
}

//
// Utils
//
function findBoundariesOpenCV(imageData) {
  var src = cv.matFromImageData(imageData);
  var dst = cv.Mat.zeros(src.cols, src.rows, cv.CV_8UC3);
  cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
  cv.threshold(src, src, 1, 255, cv.THRESH_BINARY);
  var contours = new cv.MatVector();
  var hierarchy = new cv.Mat();
  // // You can try more different parameters
  cv.findContours(src, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_NONE);

  var boundaries = [];
  for (var i = 0; i < contours.size(); i++) {
    var cnt = contours.get(i);
    if (cv.contourArea(cnt) > 5) {
      var bnd = [];
      for (var j = 0; j < cnt.rows; j++) {
        bnd.push([cnt.data32S[j*2], cnt.data32S[j*2+1]])
      }
      boundaries.push(bnd);
    }
    cnt.delete();
  }
  src.delete();
  dst.delete();
  contours.delete();
  hierarchy.delete();
  return boundaries;
}

//
// Exports
//
function loadAnnotations(anns) {
  if (anns == null) {
    return;
  }
  for (var i = 0; i < anns.length; i++) {
    setTimeout(function(ann) {
      var category = ann["category"];
      var rle = ann["segmentation"];
      var mask = rleToMask(rle);
      var annotation = new Annotation(category, mask);
      annotation.updateBoundary();
      sortAnnotations();
    }, 100, anns[i]);
  }
}

function saveAnnotations() {
  console.time("Save");
  var anns = [];
  for (var i = 0; i < annotations.length; i++) {
    var name = annotations[i].name;
    var mask = annotations[i].mask;
    var rle = maskToRLE(mask);

    var ann = {};
    ann["category"] = name;
    ann["segmentation"] = rle;
    anns.push(ann);
  }
  console.timeEnd("Save");
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

function clearAnnotations() {
  for (var i = 0; i < annotations.length; i++) {
    annotations[i].delete();
  }
  annotations = [];
  selectTool.switch();
}

window.Annotation = Annotation;
window.annotations = [];
window.loadAnnotations = loadAnnotations;
window.saveAnnotations = saveAnnotations;
window.clearAnnotations = clearAnnotations;
