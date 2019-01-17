/**
 * Annotation tool powered by PaperJS.
 */
 
function Annotation(name){
  this.name = name;
  this.boundary = new CompoundPath();
  this.raster = new Raster({size: new Size(background.image.width, background.image.height)});
  this.rasterinv = this.raster.clone();

 // Add to data structures
  this.id = this.raster.id;
  annotations.unshift(this);
  tree.addAnnotation(this);
  background.align(this);

  // Undo
  this.undoHistory = [];
  this.redoHistory = [];

  // Styles
  this.visible = true;
  this.color = new Color(Math.random(), Math.random(), Math.random(), 1);
  this.colorinv = this.color / 2;
  this.unhighlight();
}
Annotation.prototype.setMask = function(mask) {
  this.raster.size = new Size(mask.shape[1], mask.shape[0]);
  this.rasterinv.size = new Size(mask.shape[1], mask.shape[0]);
  background.align(this);

  setRasterWithMask(this.raster, this.color, mask);
  this.updateBoundary();
  this.updateRaster();
}
Annotation.prototype.getMask = function() {
  var imageData = this.raster.getImageData();
  var mask = imageDataToMask(imageData);
  return mask;
}
Annotation.prototype.updateRaster = function(boundary) {
  console.time("updateRaster");
  if ( ! boundary) {
    boundary = this.boundary;
  }

  // Update raster
  setRasterWithPath(this.raster, this.color, boundary);
  // Update rasterinv
  var boundaryinv = new CompoundPath({
    children: [new Path.Rectangle(background.image.bounds), boundary.clone()],
    fillRule: "evenodd"
  });
  boundaryinv.remove();
  setRasterWithPath(this.rasterinv, this.colorinv, boundaryinv);
  console.timeEnd("updateRaster");
}
Annotation.prototype.updateBoundary = function() {
  console.time("updateBoundary");
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

  this.boundary.pathData = paths.pathData;
  background.toPointSpace(this.boundary);

  this.undoHistory.push(paths.pathData);
  this.redoHistory = [];
  sortAnnotations();
  console.timeEnd("updateBoundary");
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
    var pathData = this.undoHistory[this.undoHistory.length-1];
    var boundary = new CompoundPath(pathData);
    background.toPointSpace(boundary);
    boundary.remove();

    this.boundary.pathData = boundary.pathData;
    this.updateRaster();

    paper.tool.refreshTool();
    return true;
  }
  return false;
}
Annotation.prototype.redo = function() {
  if (this.redoHistory != 0) {
    var pathData = this.redoHistory.pop();
    this.undoHistory.push(pathData);
    var boundary = new CompoundPath(pathData);
    background.toPointSpace(boundary);
    boundary.remove();

    this.boundary.pathData = boundary.pathData;
    this.updateRaster();

    paper.tool.refreshTool();
    return true;
  }
  return false;
}
Annotation.prototype.changeColor = function() {
  this.color = new Color(Math.random(), Math.random(), Math.random(), 1);
  this.colorinv = this.color / 2;

  this.boundary.strokeColor = this.color;
  this.updateRaster();
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
Annotation.prototype.containsPoint = function(point) {
  var pixel = background.getPixel(point);
  return this.containsPixel(pixel);
}
Annotation.prototype.containsPixel = function(pixel) {
  var c = this.raster.getPixel(pixel);
  return c.alpha > 0.5;
}

//
// Edit Annotation
//
Annotation.prototype.unite = function(path) {
  var path_raster = rasterize(path, "red");
  path_raster.remove();
  if (path_raster.height == 0 || path_raster.width == 0) {
    return;
  }

  var pixels = getRasterPixels(path_raster);
  editRasterCrop(this.raster, path_raster.bounds, pixels, this.color);
  editRasterCrop(this.rasterinv, path_raster.bounds, pixels, new Color(0,0,0,0));
}
Annotation.prototype.subtract = function(path) {
  var path_raster = rasterize(path, "red");
  path_raster.remove();
  if (path_raster.height == 0 || path_raster.width == 0) {
    return;
  }
  
  var pixels = getRasterPixels(path_raster);
  editRasterCrop(this.raster, path_raster.bounds, pixels, new Color(0,0,0,0));
  editRasterCrop(this.rasterinv, path_raster.bounds, pixels, this.colorinv);
}
function getRasterPixels(raster) {
  var pixels = [];
  var imageData = raster.getImageData();
  var mask = imageDataToMask(imageData);
  for (var x = 0; x < mask.shape[1]; x++) {
    for (var y = 0; y < mask.shape[0]; y++) {
      if (mask.get(y,x) != 0) {
        pixels.push(new Point(x,y));
      }
    }
  }
  return pixels;
}
function editRasterCrop(raster, crop_bbox, pixels, color) {
  var crop = raster.getImageData(crop_bbox);
  for (var i = 0; i < pixels.length; i++) {
      setPixelColor(crop, pixels[i], color);
  }
  raster.setImageData(crop, crop_bbox.topLeft);
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
function setRasterWithPath(raster, color, path) {
  clearRaster(raster);

  var path_raster = rasterize(path, color);
  path_raster.remove();
  if (path_raster.height == 0 || path_raster.width == 0) {
    return;
  }
  var imageData = path_raster.getImageData();
  var tl = path_raster.bounds.topLeft;
  raster.setImageData(imageData, tl);
}
function setRasterWithMask(raster, color, mask) {
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
function clearRaster(raster) {
  var cv = document.createElement('canvas');
  var ctx = cv.getContext('2d');
  var imageData = ctx.getImageData(0, 0, raster.width, raster.height);
  raster.setImageData(imageData, new Point(0, 0));
}
function rasterize(path, color) {
  var clone = path.clone();
  clone.fillColor = color;
  clone.strokeWidth = 0;
  background.toPixelSpace(clone);
  clone.translate(new Point(0.5, 0.5)); // Align for rasterize.

  var path_raster = clone.rasterize(paper.view.resolution / window.devicePixelRatio);
  clone.remove();
  return path_raster;
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
  this.boundary.fillColor = null;
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
    var annotation = new Annotation(category);
    annotation.setMask(mask);
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
    var mask = annotations[i].getMask();
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
