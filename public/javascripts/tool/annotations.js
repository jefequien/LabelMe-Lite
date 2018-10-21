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
  this.unhighlight();

  this.id = this.raster.id;

  annotations.unshift(this); // add to front
  background.align(this);
  tree.addAnnotation(this);
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
  background.toPointSpace(boundary);
  boundary.remove();

  this.boundary.pathData = boundary.pathData;
}
Annotation.prototype.updateMask = function() {
  var imageData = this.raster.getImageData();
  var mat = cv.matFromImageData(imageData);
  var array = matToArray(mat);
  var mask = array.slice(null,null,3);
  if (nj.max(mask) > 1) {
    mask = mask.divide(nj.max(mask));
  }
  this.mask = mask;
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
  this.boundary.translate(delta);
}
Annotation.prototype.scale = function(scale, center) {
  this.raster.scale(scale, center);
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
  this.edit(shape, this.color);
}
Annotation.prototype.subtract = function(shape) {
  this.edit(shape, new Color(0,0,0,0));
}
Annotation.prototype.edit = function(shape, color) {
  var imageData = this.raster.getImageData();
  var shape_pixel = shape.clone();
  background.toPixelSpace(shape_pixel);
  shape_pixel.remove();

  // Edit boundary pixels
  for (var i = 0; i < shape_pixel.length; i++) {
    var pixel = shape_pixel.getPointAt(i);
    setPixelColor(imageData, pixel, color);
  }

  // Edit interior pixels
  var tl = background.getPixel(shape.bounds.topLeft);
  var br = background.getPixel(shape.bounds.bottomRight);
  for (var x = tl.x; x <= br.x; x++) {
    for (var y = tl.y; y <= br.y; y++) {
      var pixel = new Point(x,y);
      if (shape_pixel.contains(pixel)) {
        setPixelColor(imageData, pixel, color);
      }
    }
  }
  this.raster.setImageData(imageData, new Point(0,0));
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
    var category = anns[i]["category"];
    var rle = anns[i]["segmentation"];
    var mask = rleToMask(rle);
    var annotation = new Annotation(category, mask);
    annotation.refresh();
  }
}

function saveAnnotations() {
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
