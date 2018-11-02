/**
 * Annotation tool powered by PaperJS.
 */
 
function Annotation(name, mask){
  console.time(name);
  this.name = name;
  this.color = new Color(Math.random(), Math.random(), Math.random(), 1);
  this.colorinv = this.color / 2;

  // Mask
  this.mask = mask;
  if (this.mask == null) {
    this.mask = nj.zeros([background.image.height, background.image.width]);
  }
  // Raster
  this.raster = new Raster({size: new Size(this.mask.shape[1], this.mask.shape[0])});
  this.rasterinv = this.raster.clone();
  this.id = this.raster.id;
  // Boundary
  this.boundary = new CompoundPath();
  this.boundaryPixels = [];
  this.boundaryHistory = [];

  annotations.unshift(this); // add to front
  background.align(this);
  tree.addAnnotation(this);

  this.unhighlight();
  this.visible = true;
  console.timeEnd(name);
}
Annotation.prototype.updateRaster = function() {
  setRaster(this.raster, this.color, this.mask);
}
Annotation.prototype.updateRasterInv = function() {
  this.updateMask();
  var maskinv = nj.add(nj.multiply(this.mask, -1), 1);
  setRaster(this.rasterinv, this.colorinv, maskinv);
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
  paths.remove();

  this.boundaryHistory.push(paths.pathData);
  this.boundary.pathData = paths.pathData;
  background.toPointSpace(this.boundary);

  sortAnnotations();
}
Annotation.prototype.updateMask = function() {
  var imageData = this.raster.getImageData();
  var mat = cv.matFromImageData(imageData);
  var array = matToArray(mat);
  var mask = array.slice(null,null,3).clone();

  var flat = mask.flatten();
  var mask = []
  var b = 0;
  for (var i = 0; i < flat.shape[0]; i++) {
    if (flat.get(i) == 255) {
      mask.push(1);
    } else {
      mask.push(0);
    }
  }
  this.mask = nj.uint8(mask).reshape(this.raster.height, this.raster.width);
}
Annotation.prototype.delete = function() {
  if (confirm('Are you sure you want to delete the annotation of ' + this.name +'?')) {
    this.raster.remove();
    this.rasterinv.remove();
    this.boundary.remove();
    annotations.splice(annotations.indexOf(this), 1);
    tree.deleteAnnotation(this);
    this.deleted = true;
    console.log("Deleted annotation.");
  }
}
Annotation.prototype.undo = function() {
  if (this.boundaryHistory.length > 1) {
    this.boundaryHistory.pop();
    var oldBoundary = new CompoundPath(this.boundaryHistory[this.boundaryHistory.length-1]);
    background.toPointSpace(oldBoundary);

    var pixels0 = getPixelsBoundary(oldBoundary);
    var pixels1 = getPixelsInterior(oldBoundary);
    var pixels = pixels0.concat(pixels1);

    this.mask = nj.zeros(this.mask.shape);
    this.updateRaster();
    editRaster(this.raster, this.color, pixels);

    this.boundary.pathData = oldBoundary.pathData;
    this.boundaryPixels = pixels0;
    oldBoundary.remove();
    return true;
  }
  return false;
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
  this.rasterinv.opacity = 0;
  this.boundary.strokeColor = this.color;
  this.boundary.strokeWidth = 3;

  tree.setActive(this, true);
}
Annotation.prototype.unhighlight = function() {
  this.highlighted = false;
  this.raster.opacity = 0.7;
  this.rasterinv.opacity = 0;
  this.boundary.strokeColor = this.color;
  this.boundary.strokeWidth = 0;

  tree.setActive(this, false);
}
Annotation.prototype.hide = function() {
  this.highlighted = false;
  this.raster.opacity = 0;
  this.rasterinv.opacity = 0;
  this.boundary.strokeColor = this.color;
  this.boundary.strokeWidth = 0;

  tree.setActive(this, false);
}
Annotation.prototype.setInvisible = function() {
  this.visible = false;
  this.raster.visible = false;
  this.rasterinv.visible = false;
  this.boundary.visible = false;
}
Annotation.prototype.setVisible = function() {
  this.visible = true;
  this.raster.visible = true;
  this.rasterinv.visible = true;
  this.boundary.visible = true;
}

//
// Edit raster
//
Annotation.prototype.unite = function(shape) {
  var pixels0 = getPixelsBoundary(shape);
  var pixels1 = getPixelsInterior(shape);
  var pixels = pixels0.concat(pixels1);
  editRaster(this.raster, this.color, pixels, "unite");
  editRaster(this.rasterinv, this.colorinv, pixels, "subtract");
}
Annotation.prototype.subtract = function(shape) {
  var pixels0 = getPixelsBoundary(shape);
  var pixels1 = getPixelsInterior(shape);
  var pixels = pixels0.concat(pixels1);
  editRaster(this.raster, this.color, pixels, "subtract");
  editRaster(this.rasterinv, this.colorinv, pixels, "unite");
}
Annotation.prototype.flip = function(shape) {
  var pixels0 = getPixelsBoundary(shape);
  var pixels1 = getPixelsInterior(shape);
  var pixels = pixels0.concat(pixels1);

  var pixelsUnique = [];
  var pixelsSet = new Set();
  for (var i = 0; i < pixels.length; i++) {
    var str = JSON.stringify(pixels[i]);
    if ( ! pixelsSet.has(str)) {
      pixelsUnique.push(pixels[i]);
      pixelsSet.add(str);
    }
  }
  editRaster(this.raster, this.color, pixelsUnique, "flip");
  editRaster(this.rasterinv, this.colorinv, pixelsUnique, "flip");
}
Annotation.prototype.unitePath = function(shape) {
  var pixels = getPixelsBoundary(shape);
  editRaster(this.raster, this.color, pixels, "unite");
  editRaster(this.rasterinv, this.colorinv, pixels, "subtract");
}
Annotation.prototype.subtractPath = function(shape) {
  var pixels = getPixelsBoundary(shape);
  editRaster(this.raster, this.color, pixels, "subtract");
  editRaster(this.rasterinv, this.colorinv, pixels, "unite");
}
Annotation.prototype.containsPixel = function(pixel) {
  var c = this.raster.getPixel(pixel);
  return c.alpha > 0.5;
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
function editRaster(raster, color, pixels, rule) {
  var imageData = raster.getImageData();
  var clear = new Color(0,0,0,0);
  for (var i = 0; i < pixels.length; i++) {
    if (rule == "unite") {
      setPixelColor(imageData, pixels[i], color);
    } else if (rule == "subtract") {
      setPixelColor(imageData, pixels[i], clear);
    } else if (rule == "flip") {
      var c = getPixelColor(imageData, pixels[i]);
      if (c.alpha > 0.5) {
        setPixelColor(imageData, pixels[i], clear);
      } else {
        setPixelColor(imageData, pixels[i], color);
      }
    }
  }
  raster.setImageData(imageData, new Point(0, 0));
}
function setPixelColor(imageData, pixel, color) {
  var x = Math.round(pixel.x);
  var y = Math.round(pixel.y);
  if (x < 0 || y < 0
    || x >= imageData.width || y >= imageData.height) {
    return;
  }
  var p = (y * imageData.width + x) * 4;
  imageData.data[p] = color.red * 255;
  imageData.data[p+1] = color.green * 255;
  imageData.data[p+2] = color.blue * 255;
  imageData.data[p+3] = color.alpha * 255;
}
function getPixelColor(imageData, pixel) {
  var x = Math.round(pixel.x);
  var y = Math.round(pixel.y);
  var p = (y * imageData.width + x) * 4;
  var color = new Color();
  color.red = imageData.data[p] / 255;
  color.green = imageData.data[p+1]/ 255;
  color.blue = imageData.data[p+2] / 255;
  color.alpha = imageData.data[p+3] / 255;
  return color;
}
function getPixelsInterior(shape) {
  var pixels = [];

  var clone = shape.clone();
  clone.strokeWidth = 0;
  clone.fillColor = "red";
  background.toPixelSpace(clone);
  clone.translate(new Point(-0.5, -0.5)); // Align to prepare for rasterize.
  var raster = clone.rasterize();
  raster.translate(new Point(0.5, 0.5)); // Move back
  var imageData = raster.getImageData();
  clone.remove();
  raster.remove();

  var tlPixel = raster.bounds.topLeft + new Point(0.5, 0.5);
  background.toPointSpace(raster);
  for (var x = 0; x < imageData.width; x++) {
    for (var y = 0; y < imageData.height; y++) {
      var pixel = new Point(x,y);
      var color = getPixelColor(imageData, pixel);
      if (color.alpha > 0.5) {
        pixel += tlPixel;
        pixels.push(pixel.round());
      }
    }
  }
  return pixels;
}
function getPixelsBoundary(path) {
  var pixels = [];

  if ( ! path.length) {
    path = path.toPath();
    path.remove();
  }
  // Recursive for compoundPaths
  if (path.children) {
    for (var i = 0; i < path.children.length; i++) {
      pixels = pixels.concat(getPixelsBoundary(path.children[i]));
    }
    return pixels;
  } else {
    var path_pixel = path.clone();
    path_pixel.remove();
    background.toPixelSpace(path_pixel);
    for (var i = 0; i < path_pixel.length; i = i + 0.5) {
      var pixel = path_pixel.getPointAt(i);
      pixels.push(pixel.round());
    }
    return pixels;
  }
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
  setTimeout(function(anns) {
    for (var i = 0; i < anns.length; i++) {
      var category = anns[i]["category"];
      var rle = anns[i]["segmentation"];
      var mask = rleToMask(rle);
      var annotation = new Annotation(category, mask);
      annotation.updateRaster();
      annotation.updateBoundary();
    }
  }, 100, anns);
}

function saveAnnotations() {
  console.time("Save");
  var anns = [];
  for (var i = 0; i < annotations.length; i++) {
    annotations[i].updateMask();
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
