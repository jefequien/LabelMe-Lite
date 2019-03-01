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
  this.color = new Color(Math.random(), Math.random(), Math.random(), 1);
  this.colorinv = this.color / 2;
  this.visible = true;
  this.unhighlight();
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

  this.boundary.pathData = paths.pathData;
  this.toPointSpace(this.boundary);
  sortAnnotations();

  // Undo history
  if (this.undoHistory.length == 0 || paths.pathData != this.undoHistory[this.undoHistory.length-1]) {
    this.undoHistory.push(paths.pathData);
    this.redoHistory = [];
  }
}
Annotation.prototype.updateRaster = function(boundary) {
  var boundary = (boundary) ? boundary : this.boundary;
  var boundaryinv = new CompoundPath({
    children: [new Path.Rectangle(this.raster.bounds), boundary.clone()],
    fillRule: "evenodd"
  });
  boundaryinv.remove();

  var boundary_raster = this.rasterize(boundary, this.color);
  var boundaryinv_raster = this.rasterize(boundaryinv, this.colorinv);
  boundary_raster.remove();
  boundaryinv_raster.remove();

  // Clear rasters
  var cv = document.createElement('canvas');
  var ctx = cv.getContext('2d');
  var imageData = ctx.getImageData(0, 0, this.raster.width, this.raster.height);
  this.raster.setImageData(imageData, new Point(0, 0));
  this.rasterinv.setImageData(imageData, new Point(0, 0));

  // Set rasters
  if (boundary_raster.height != 0 && boundary_raster.width != 0) {
    var imageData = boundary_raster.getImageData();
    this.raster.setImageData(imageData, boundary_raster.bounds.topLeft);
  }
  if (boundaryinv_raster.height != 0 && boundaryinv_raster.width != 0) {
    var imageData = boundaryinv_raster.getImageData();
    this.rasterinv.setImageData(imageData, boundaryinv_raster.bounds.topLeft);
  }
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
    this.toPointSpace(boundary);
    boundary.remove();

    this.boundary.pathData = boundary.pathData;
    this.updateRaster();
    return true;
  }
  return false;
}
Annotation.prototype.redo = function() {
  if (this.redoHistory.length != 0) {
    var pathData = this.redoHistory.pop();
    this.undoHistory.push(pathData);
    var boundary = new CompoundPath(pathData);
    this.toPointSpace(boundary);
    boundary.remove();

    this.boundary.pathData = boundary.pathData;
    this.updateRaster();
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
Annotation.prototype.changeColor = function() {
  this.color = new Color(Math.random(), Math.random(), Math.random(), 1);
  this.colorinv = this.color / 2;
  this.boundary.strokeColor = this.color;
  this.updateRaster();
}

//
// Point to Pixel
//
Annotation.prototype.containsPixel = function(pixel) {
  var c = this.raster.getPixel(pixel);
  return c.alpha > 0.5;
}
Annotation.prototype.containsPoint = function(point) {
  var pixel = this.getPixel(point);
  return this.containsPixel(pixel);
}
Annotation.prototype.getPixel = function(point) {
  var bounds = this.raster.bounds;
  var size = this.raster.size;
  var tl = bounds.topLeft;

  var x = (point.x - tl.x) * (size.height/ bounds.height) - 0.5;
  var y = (point.y - tl.y) * (size.height/ bounds.height) - 0.5;
  return new Point(x, y);
}
Annotation.prototype.getPoint = function(pixel) {
  var bounds = this.raster.bounds;
  var size = this.raster.size;
  var tl = bounds.topLeft;

  var x = (pixel.x + 0.5) * (bounds.height / size.height) + tl.x;
  var y = (pixel.y + 0.5) * (bounds.height / size.height) + tl.y;
  return new Point(x, y);
}
Annotation.prototype.toPixelSpace = function(path) {
  var bounds = this.raster.bounds;
  var size = this.raster.size;
  var tl = bounds.topLeft;

  path.translate(-tl);
  path.scale(size.height / bounds.height, new Point(0, 0));
  path.translate(new Point(-0.5, -0.5));
}
Annotation.prototype.toPointSpace = function(path) {
  var bounds = this.raster.bounds;
  var size = this.raster.size;
  var tl = bounds.topLeft;

  path.translate(new Point(0.5, 0.5));
  path.scale(bounds.height / size.height, new Point(0, 0));
  path.translate(tl);
}

//
// Edit Annotation with brushTool
//
Annotation.prototype.unite = function(path) {
  var path_raster = this.rasterize(path, "red");
  path_raster.remove();
  if (path_raster.height == 0 || path_raster.width == 0) {
    return;
  }

  var pixels = getRasterPixels(path_raster);
  editRasterCrop(this.raster, path_raster.bounds, pixels, this.color);
  editRasterCrop(this.rasterinv, path_raster.bounds, pixels, new Color(0,0,0,0));
}
Annotation.prototype.subtract = function(path) {
  var path_raster = this.rasterize(path, "red");
  path_raster.remove();
  if (path_raster.height == 0 || path_raster.width == 0) {
    return;
  }
  
  var pixels = getRasterPixels(path_raster);
  editRasterCrop(this.raster, path_raster.bounds, pixels, new Color(0,0,0,0));
  editRasterCrop(this.rasterinv, path_raster.bounds, pixels, this.colorinv);
}
Annotation.prototype.rasterize = function(path, color) {
  var clone = path.clone();
  clone.fillColor = color;
  clone.strokeColor = color;
  clone.strokeWidth = 0.1;
  this.toPixelSpace(clone);
  clone.translate(new Point(0.5, 0.5)); // Align for rasterize.

  var path_raster = clone.rasterize(paper.view.resolution / window.devicePixelRatio);
  clone.remove();
  return path_raster;
}
function getRasterPixels(raster) {
  var pixels = [];
  var imageData = raster.getImageData();
  for (var x = 0; x < raster.width; x++) {
    for (var y = 0; y < raster.height; y++) {
      var p = (y * raster.width + x) * 4;
      if (imageData.data[p+3] != 0) {
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
// RLE
//
Annotation.prototype.loadRLE = function(rle) {
  var height = rle["size"][0];
  var width = rle["size"][1];
  var cnts = rleFrString(rle["counts"]);

  this.raster.size = new Size(width, height);
  this.rasterinv.size = new Size(width, height);
  background.align(this);

  var imageData = this.raster.getImageData();
  var color = [this.color.red * 255, this.color.green * 255, this.color.blue * 255, 255];

  var sum = 0;
  for (var i = 0; i < cnts.length; i++) {
    if (i % 2 == 0) {
      sum += cnts[i];
    } else {
      for (var j = sum; j < sum + cnts[i]; j++) {
        var y = j % height;
        var x = Math.floor(j / height);
        var index = (y * width + x) * 4;
        imageData.data[index] = color[0];
        imageData.data[index+1] = color[1];
        imageData.data[index+2] = color[2];
        imageData.data[index+3] = color[3];
      }
      sum += cnts[i];
    }
  }
  this.raster.setImageData(imageData, new Point(0,0));
}
Annotation.prototype.getRLE = function() {
  var height = this.raster.height;
  var width = this.raster.width;
  var imageData = this.raster.getImageData();

  // Get bbox for faster computation
  var tl = this.getPixel(this.boundary.bounds.topLeft).round();
  var br = this.getPixel(this.boundary.bounds.bottomRight).round();

  var cnts = [tl.x * height, 0];
  for (var x = tl.x; x <= br.x; x++) {
    // Handle column
    var run_start = 0;
    var last_b = 0;
    for (var y = tl.y; y <= br.y; y++) {
      var index = (y * width + x) * 4;
      var b = (imageData.data[index+3] == 0) ? 0 : 1;
      if (b != last_b) {
        cnts.push(y - run_start);
        run_start = y;
        last_b = b;
      }
    }
    if (last_b == 1) {
      cnts.push((br.y + 1) - run_start);
      run_start = br.y + 1;
    }
    cnts.push(height - run_start); // cnt for 0s
    cnts.push(0); // cnt for 1s
  }
  cnts.push((width - (br.x + 1)) * height);

  // Remove zeros
  cnts_compressed = [];
  while (cnts.length > 0) {
    var c = cnts.shift();
    if (c == 0 && cnts_compressed.length > 0 && cnts.length > 0) {
      cnts_compressed[cnts_compressed.length-1] += cnts.shift();
    } else {
      cnts_compressed.push(c);
    }
  }
  if (cnts_compressed[cnts_compressed.length-1] == 0) {
    cnts_compressed.pop();
  }

  var rle = {};
  rle["size"] = [this.raster.height, this.raster.width];
  rle["counts"] = rleToString(cnts_compressed);
  return rle;
}
function rleFrString(s) {
  var m = 0;
  var p = 0;
  var cnts = [];
  while (p < s.length) {
    var x = 0;
    var k = 0;
    var c = 0;
    var more = 1;
    while (more) {
      c = s.charCodeAt(p) - 48;
      x = x | ((c & 0x1f) << 5*k);
      more = c & 0x20;
      p += 1;
      k += 1;
      if (!more && (c & 0x10)) {
        x = x | (-1 << 5*k);
      }
    }
    if (m > 2) {
      x += cnts[m-2];
    }
    m += 1;
    cnts.push(x);
  }
  return cnts;
}
function rleToString(cnts) {
  var s = "";
  for (var i = 0 ; i < cnts.length; i++) {
    var x = cnts[i];
    if (i > 2) {
      x -= cnts[i-2];
    }
    var more = 1;
    while (more) {
      c = x & 0x1f;
      x >>= 5;
      more = (c & 0x10) ? x!=-1 : x!=0;
      if(more) {
        c = c | 0x20;
      }
      c += 48;
      s += String.fromCharCode(c);
    }
  }
  return s;
}

//
// Exports
//
function loadAnnotations(anns) {
  console.time("Load");
  for (var i = 0; i < anns.length; i++) {
    var category = anns[i]["category"];
    var rle = anns[i]["segmentation"];

    console.time(category);
    var annotation = new Annotation(category);
    console.time("rle");
    annotation.loadRLE(rle);
    console.timeEnd("rle");
    console.time("boundary");
    annotation.updateBoundary();
    console.timeEnd("boundary");
    console.time("raster");
    annotation.updateRaster();
    console.timeEnd("raster");
    console.timeEnd(category);
  }
  if (annotations.length == 0) {
    tree.setMessage("No annotations.");
  }
  console.timeEnd("Load");
}

function saveAnnotations() {
  console.time("Save");
  var anns = [];
  for (var i = 0; i < annotations.length; i++) {
    var name = annotations[i].name;
    var rle = annotations[i].getRLE();

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
        ann0.rasterinv.insertBelow(ann1.rasterinv);
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

window.annotations = [];
window.Annotation = Annotation;
window.loadAnnotations = loadAnnotations;
window.saveAnnotations = saveAnnotations;
window.clearAnnotations = clearAnnotations;
