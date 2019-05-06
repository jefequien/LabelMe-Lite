/**
 * Annotation tool powered by PaperJS.
 */
 
function Annotation(name){
  this.name = name;
  this.boundary = new CompoundPath({fillRule: "evenodd"});
  this.raster = new Raster({
    size: background.image.size, 
    smoothing: false
  });

 // Add to data structures
  this.id = this.raster.id;
  annotations.unshift(this);
  tree.addAnnotation(this);
  background.align(this);

  // Undo and redo
  this.undoHistory = [];
  this.redoHistory = [];

  // Styles
  this.color = new Color(Math.random(), Math.random(), Math.random(), 1);
  this.unhighlight();
}
Annotation.prototype.updateBoundary = function() {
  var imageData = this.raster.getImageData();
  var boundaries = findBoundariesOpenCV(imageData);

  var children = [];
  for (var i = 0; i < boundaries.length; i++) {
    children.push(new Path({closed: true, segments: boundaries[i]}));
  }
  this.boundary.children = children;
  toPointSpace(this.boundary, this.raster);

  sortAnnotations();
  this.addToUndoHistory();
}
Annotation.prototype.updateRaster = function(boundary) {
  var boundary = (boundary) ? boundary : this.boundary;
  var raster = this.rasterize(boundary, this.color);
  raster.remove();

  var cv = this.raster.canvas;
  var ctx = cv.getContext('2d');

  ctx.clearRect(0, 0, cv.width, cv.height);
  if (raster.height != 0 || raster.width != 0) {
    this.raster.setImageData(raster.getImageData(), raster.bounds.topLeft);
  }
}

//
// Edit Functions
//
Annotation.prototype.unite = function(path) {
  var raster = this.rasterize(path, this.color);
  var tl = raster.bounds.topLeft;
  var imageData = raster.getImageData();
  raster.remove();

  var cv = this.raster.canvas;
  var ctx = cv.getContext('2d');
  createImageBitmap(imageData).then(function(imgBitmap) {
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(imgBitmap, tl.x, tl.y);
  });
}
Annotation.prototype.subtract = function(path) {
  var raster = this.rasterize(path, this.color);
  var tl = raster.bounds.topLeft;
  var imageData = raster.getImageData();
  raster.remove();

  var cv = this.raster.canvas;
  var ctx = cv.getContext('2d');
  createImageBitmap(imageData).then(function(imgBitmap) {
    ctx.globalCompositeOperation = "destination-out";
    ctx.drawImage(imgBitmap, tl.x, tl.y);
  });
}
Annotation.prototype.rasterize = function(path, color) {
  var clone = path.clone();
  clone.strokeWidth = 0;
  clone.fillColor = color;
  toPixelSpace(clone, this.raster);
  clone.translate(new Point(0.5, 0.5)); // Align for rasterize.
  var raster = clone.rasterize(paper.view.resolution / window.devicePixelRatio);
  clone.remove();
  raster.smoothing = false;
  return raster;
}

// 
// Undo and redo
// 
Annotation.prototype.undo = function() {
  if (this.undoHistory.length <= 1) {
    return false;
  }

  var currentBoundary = this.undoHistory.pop();
  this.redoHistory.push(currentBoundary);

  var pathData = this.undoHistory[this.undoHistory.length-1];
  this.boundary.pathData = pathData;
  toPointSpace(this.boundary, this.raster);
  this.updateRaster();
  return true;
}
Annotation.prototype.redo = function() {
  if (this.redoHistory.length == 0) {
    return false;
  }
  var pathData = this.redoHistory.pop();
  this.undoHistory.push(pathData);

  this.boundary.pathData = pathData;
  toPointSpace(this.boundary, this.raster);
  this.updateRaster();
  return true;
}
Annotation.prototype.addToUndoHistory = function() {
  toPixelSpace(this.boundary, this.raster);
  var pathData = this.boundary.pathData;
  toPointSpace(this.boundary, this.raster);

  if (pathData != this.undoHistory[this.undoHistory.length-1]) {
    this.undoHistory.push(pathData);
    this.redoHistory = [];
  }
}
Annotation.prototype.delete = function() {
  this.boundary.remove();
  this.raster.remove();

  annotations.splice(annotations.indexOf(this), 1);
  tree.deleteAnnotation(this);
}
Annotation.prototype.undelete = function() {
  project.activeLayer.addChild(this.boundary);
  project.activeLayer.addChild(this.raster);

  annotations.unshift(this);
  tree.addAnnotation(this);
  background.align(this);
}

//
// Transform
//
Annotation.prototype.translate = function(delta) {
  this.boundary.translate(delta);
  this.raster.translate(delta);
}
Annotation.prototype.scale = function(scale, center) {
  this.boundary.scale(scale, center);
  this.raster.scale(scale, center);
}
Annotation.prototype.changeColor = function() {
  this.color = new Color(Math.random(), Math.random(), Math.random(), 1);
  this.boundary.strokeColor = this.color;
  this.updateRaster();
}
Annotation.prototype.containsPixel = function(pixel) {
  var c = this.raster.getPixel(pixel.round());
  return c.alpha != 0;
}
Annotation.prototype.containsPoint = function(point) {
  var pixel = getPixel(point, this.raster);
  return this.containsPixel(pixel);
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
Annotation.prototype.emphasizeMask = function() {
  this.raster.opacity = 0.7;
  this.boundary.strokeColor = this.color;
  this.boundary.strokeWidth = 0;
  this.boundary.fillColor = null;
}
Annotation.prototype.emphasizeBoundary = function() {
  this.raster.opacity = 0.2;
  this.boundary.strokeColor = this.color;
  this.boundary.strokeWidth = paper.tool.toolSize;
  this.boundary.fillColor = null;
}
Annotation.prototype.hide = function() {
  this.raster.opacity = 0;
  this.boundary.strokeColor = this.color;
  this.boundary.strokeWidth = 0;
  this.boundary.fillColor = null;
}

//
// RLE
//
Annotation.prototype.loadRLE = function(rle) {
  var height = rle["size"][0];
  var width = rle["size"][1];
  var color = [this.color.red * 255, this.color.green * 255, this.color.blue * 255, 255];
  var imageData = loadRLE(rle, color);

  this.raster.size = new Size(width, height);
  this.raster.setImageData(imageData, new Point(0,0));
  background.align(this);
}
Annotation.prototype.getRLE = function() {
  var imageData = this.raster.getImageData();
  var bbox = this.getBbox();
  var rle = getRLE(imageData, bbox);
  return rle;
}
Annotation.prototype.getBbox = function() {
  var tl = getPixel(this.boundary.bounds.topLeft, this.raster).round();
  var br = getPixel(this.boundary.bounds.bottomRight, this.raster).round();
  var bbox = [tl.x, tl.y, br.x - tl.x, br.y - tl.y];
  return bbox;
}

//
// Exports
//
var annotationCache = {};
function loadAnnotations(coco) {
  console.time("Load");
  var img = coco.dataset.images[0];
  var annIds = coco.getAnnIds([img["id"]]);
  var anns = coco.loadAnns(annIds);

  for (var i = 0; i < anns.length; i++) {
    var ann = anns[i];
    var cat = coco.cats[ann["category_id"]]["name"];
    var rle = ann["segmentation"];

    console.time(cat);
    var cacheKey = ann["id"];
    if (cacheKey in annotationCache) {
      annotationCache[cacheKey].undelete();
    } else {
      var annotation = new Annotation(cat);
      annotation.loadRLE(rle);
      annotation.updateBoundary();
      annotationCache[cacheKey] = annotation;
    }
    console.timeEnd(cat);
  }
  console.timeEnd("Load");
}

function saveAnnotations() {
  console.time("Save");
  var imgs = [];
  var anns = [];
  var cats = [];
  for (var i = 0; i < annotations.length; i++) {
    var name = annotations[i].name;
    var rle = annotations[i].getRLE();
    var bbox = annotations[i].getBbox();

    var ann = {};
    ann["segmentation"] = rle;
    ann["bbox"] = bbox;
    ann["category_name"] = name;
    anns.push(ann);
  }
  var data = {"images": imgs, "annotations": anns, "categories": cats};
  var coco = new COCO(data);
  console.timeEnd("Save");
  return coco;
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
    annotations[0].delete();
  }
}

window.annotations = [];
window.Annotation = Annotation;
window.loadAnnotations = loadAnnotations;
window.saveAnnotations = saveAnnotations;
window.clearAnnotations = clearAnnotations;
