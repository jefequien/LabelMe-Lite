/**
 * Annotation tool powered by PaperJS.
 */
 
function Annotation(name, mask){
  this.name = name;

  // Mask
  this.mask = mask;
  if (this.mask == null) {
    this.mask = nj.zeros([background.image.height, background.image.width]);
  }

  // Raster
  this.raster = new Raster({size: new Size(this.mask.shape[1], this.mask.shape[0])});
  this.rasterinv = this.raster.clone();

  // Boundary
  this.boundary = new CompoundPath();
  this.undoHistory = [];
  this.redoHistory = [];

 // Add to data structures
  this.id = this.raster.id;
  annotations.unshift(this);
  tree.addAnnotation(this);
  background.align(this);

  // Styles
  this.visible = true;
  this.color = new Color(Math.random(), Math.random(), Math.random(), 1);
  this.colorinv = this.color / 2;
  this.unhighlight();
}
Annotation.prototype.updateRaster = function() {
  setRaster(this.raster, this.color, this.mask);
}
Annotation.prototype.updateRasterInv = function() {
  var maskinv = nj.add(nj.multiply(this.mask, -1), 1);
  setRasterOld(this.rasterinv, this.colorinv, maskinv);
}
Annotation.prototype.updateMask = function() {
  var imageData = this.raster.getImageData();
  this.mask = imageDataToMask(imageData);
}
Annotation.prototype.updateBoundary = function() {
  var imageData = this.raster.getImageData();
  var boundaries = findBoundariesOpenCV(imageData);

  var paths = [];
  for (var i = 0; i < boundaries.length; i++) {
    var path = new Path({ segments: boundaries[i] });
    path.closed = true;
    paths.push(path);
  }

  var paths = new CompoundPath({ children: paths });
  paths.remove();
  // paths.reorient(true, true);

  this.boundary.pathData = paths.pathData;
  background.toPointSpace(this.boundary);

  this.undoHistory.push(paths.pathData);
  this.redoHistory = [];
  sortAnnotations();
}
Annotation.prototype.delete = function(noConfirm) {
  var confirmed = true;
  if ( ! noConfirm) {
    confirmed = confirm('Are you sure you want to delete the annotation of ' + this.name +'?');
  }

  if (confirmed) {
    this.raster.remove();
    this.rasterinv.remove();
    this.boundary.remove();
    annotations.splice(annotations.indexOf(this), 1);
    tree.deleteAnnotation(this);
    this.deleted = true;
    console.log("Deleted annotation.");
    return true;
  }
  return false;
}
Annotation.prototype.undo = function() {
  if (this.undoHistory.length > 1) {
    var currentBoundary = this.undoHistory.pop();
    this.redoHistory.push(currentBoundary);
    this.recoverUsingBoundaryPathData(this.undoHistory[this.undoHistory.length-1]);
    return true;
  }
  alert("No more undo for this annotation.");
  return false;
}
Annotation.prototype.redo = function() {
  if (this.redoHistory != 0) {
    var pathData = this.redoHistory.pop();
    this.undoHistory.push(pathData);
    this.recoverUsingBoundaryPathData(pathData);
    return true;
  }
  alert("No more redo for this annotation.");
  return false;
}
Annotation.prototype.recoverUsingBoundaryPathData = function(pathData) {
  var oldBoundary = new CompoundPath(pathData);
  oldBoundary.remove();
  background.toPointSpace(oldBoundary);

  // Clear mask
  this.mask = nj.zeros(this.mask.shape);
  this.updateRaster();
  this.updateRasterInv();

  var pixels = background.getAllPixels(oldBoundary);
  this.unitePixels(pixels);
  this.boundary.pathData = oldBoundary.pathData;
}
Annotation.prototype.changeColor = function() {
  this.color = new Color(Math.random(), Math.random(), Math.random(), 1);
  this.colorinv = this.color / 2;

  this.boundary.strokeColor = this.color;
  this.updateMask();
  this.updateRaster();
  this.updateRasterInv();
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
  tree.setActive(this, true);
  this.emphasizeBoundary();
  if (annotations.styleInverted) {
    this.emphasizeMask();
  }

  // Load rasterinv here to decrease loading time
  if ( ! this.rasterinv.upToDate) {
    this.updateRasterInv();
    this.rasterinv.upToDate = true;
  }
}
Annotation.prototype.unhighlight = function() {
  this.highlighted = false;
  tree.setActive(this, false);
  this.emphasizeMask();
  if (annotations.styleInverted) {
    this.emphasizeBoundary();
  }
}
Annotation.prototype.hide = function() {
  this.highlighted = false;
  tree.setActive(this, false);

  this.raster.opacity = 0;
  this.rasterinv.opacity = 0;
  this.boundary.strokeColor = this.color;
  this.boundary.strokeWidth = 0;
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
Annotation.prototype.emphasizeMask = function() {
  this.raster.opacity = 0.7;
  this.rasterinv.opacity = 0;
  this.boundary.strokeColor = this.color;
  this.boundary.strokeWidth = 0;
  this.boundary.fillColor = null;
}
Annotation.prototype.emphasizeBoundary = function() {
  this.raster.opacity = 0.2;
  this.rasterinv.opacity = 0;
  this.boundary.strokeColor = this.color;
  this.boundary.strokeWidth = paper.tool.toolSize;
  this.boundary.fillColor = null;
}

//
// Edit raster
//
Annotation.prototype.unite = function(shape) {
  var pixels = background.getAllPixels(shape);
  this.unitePixels(pixels);
}
Annotation.prototype.subtract = function(shape) {
  var pixels = background.getAllPixels(shape);
  this.subtractPixels(pixels);
}
Annotation.prototype.flip = function(shape) {
  var pixels = background.getAllPixels(shape);
  this.flipPixels(pixels);
}
Annotation.prototype.unitePath = function(shape) {
  var pixels = background.getBoundaryPixels(shape);
  this.unitePixels(pixels);
}
Annotation.prototype.subtractPath = function(shape) {
  var pixels = background.getBoundaryPixels(shape);
  this.subtractPixels(pixels);
}
Annotation.prototype.uniteInterior = function(shape) {
  var pixels = background.getInteriorPixels(shape);
  this.unitePixels(pixels);
}
Annotation.prototype.subtractInterior = function(shape) {
  var pixels = background.getInteriorPixels(shape);
  this.subtractPixels(pixels);
}
Annotation.prototype.unitePixels = function(pixels) {
  editRaster(this.raster, this.color, pixels, "unite");
  editRaster(this.rasterinv, this.colorinv, pixels, "subtract");
}
Annotation.prototype.subtractPixels = function(pixels) {
  editRaster(this.raster, this.color, pixels, "subtract");
  editRaster(this.rasterinv, this.colorinv, pixels, "unite");
}
Annotation.prototype.flipPixels = function(pixels) {
  pixels = removeDuplicatePixels(pixels);
  editRaster(this.raster, this.color, pixels, "flip");
  editRaster(this.rasterinv, this.colorinv, pixels, "flip");
}
Annotation.prototype.containsPoint = function(point) {
  var pixel = background.getPixel(point);
  return this.containsPixel(pixel);
}
Annotation.prototype.containsPixel = function(pixel) {
  var c = this.raster.getPixel(pixel);
  return c.alpha > 0.5;
}
function setRaster(raster, color, mask) {
  var cv = document.createElement('canvas');
  var ctx = cv.getContext('2d');
  var imageData = ctx.getImageData(0,0,mask.shape[1], mask.shape[0]);

  var list = mask.tolist();
  for (var y = 0; y < list.length; y++) {
    for (var x = 0; x < list[y].length; x++) {
      b = list[y][x];
      if (b != 0) {
        var p = (y * list[y].length + x) * 4;
        imageData.data[p] = color.red * 255;
        imageData.data[p+1] = color.green * 255;
        imageData.data[p+2] = color.blue * 255;
        imageData.data[p+3] = color.alpha * 255;
      }
    }
  }
  raster.setImageData(imageData, new Point(0, 0));
}
function setRasterOld(raster, color, mask) {
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
function removeDuplicatePixels(pixels) {
  var pixelsUnique = [];
  var pixelsSet = new Set();
  for (var i = 0; i < pixels.length; i++) {
    var pixel = pixels[i].round();
    var str = JSON.stringify(pixel);
    if ( ! pixelsSet.has(str)) {
      pixelsUnique.push(pixel);
      pixelsSet.add(str);
    }
  }
  return pixelsUnique;
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
    var bnd = [];
    for (var j = 0; j < cnt.rows; j++) {
      bnd.push([cnt.data32S[j*2], cnt.data32S[j*2+1]])
    }
    if (bnd.length > 4) {
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
  console.time("Load");
  tree.setMessage("Loading annotations...");
  for (var i = 0; i < anns.length; i++) {
    var category = anns[i]["category"];
    var rle = anns[i]["segmentation"];

    console.time(category);
    var mask = rleToMask(rle);
    var annotation = new Annotation(category, mask);
    annotation.updateRaster();
    annotation.updateBoundary();
    console.timeEnd(category);
  }
  if (annotations.length == 0) {
    tree.setMessage("No annotations.");
  } else {
    tree.removeMessage();
  }
  console.timeEnd("Load");
}

function saveAnnotations() {
  console.time("Save");
  var anns = [];
  for (var i = 0; i < annotations.length; i++) {
    var name = annotations[i].name;
    annotations[i].updateMask();
    var rle = maskToRLE(annotations[i].mask);

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
  while (annotations.length > 0) {
    annotations[0].delete(true);
  }
  tree.removeMessage();
}

//
// Exports
//
window.Annotation = Annotation;
window.annotations = [];
window.loadAnnotations = loadAnnotations;
window.saveAnnotations = saveAnnotations;
window.clearAnnotations = clearAnnotations;
