/**
 * Annotation tool powered by PaperJS.
 */

function Background() {
  this.setFocusRect();
  this.clearImage();
  this.makeFilter();
  this.addListeners();

  this.focusMaxScale = 4;
  this.maxScale = 12;
  this.minScale = 0.2;
}
Background.prototype.setImage = function(image, callback) {
  var raster = new Raster(image);
  raster.position = this.viewCenter;
  raster.onLoad = function() {
    if (background.image) {
      background.image.remove();
    }
    background.image = raster;
    for (var i = 0; i < annotations.length; i++) {
      background.align(annotations[i]);
    }
    background.focus();
    background.image.sendToBack();
    background.makeFilter();
    if (callback) {
      callback();
    }
  }
}
Background.prototype.clearImage = function() {
  if (this.image) {
    this.image.remove();
  }
  this.image = new Path.Rectangle(this.focusRect).rasterize();
}
Background.prototype.makeFilter = function() {
  if (this.filter) {
    this.filter.remove();
  }

  this.image.blendMode = 'hard-light';
  this.filter = new Path.Rectangle(this.image.bounds);
  this.filter.fillColor = new Color(0.5);
  this.filter.sendToBack();
}
Background.prototype.setFocusRect = function() {
  var h = paper.view.size.height;
  var w = paper.view.size.width;
  this.viewCenter = new Point(0.5 * w, 0.5 * h);
  var tl = this.viewCenter - new Point(0.45 * w, 0.45 * h);
  var br = this.viewCenter + new Point(0.45 * w, 0.45 * h);
  this.focusRect = new Rectangle(tl, br);
}
Background.prototype.setVisible = function() {
  this.image.visible = true;
  this.filter.visible = true;
}
Background.prototype.setInvisible = function() {
  this.image.visible = false;
  this.filter.visible = false;
}

//
// Move and scale background
//
Background.prototype.move = function(delta, noSnap) {
  paper.project.activeLayer.translate(delta);
  if ( ! noSnap) {
    this.snapImage();
  }
}
Background.prototype.moveTo = function(center, noSnap) {
    var dx = this.viewCenter.x - center.x;
    var dy = this.viewCenter.y - center.y;
    this.move(new Point(dx,dy), noSnap);
}
Background.prototype.scale = function(deltaScale, noSnap) {
  paper.project.activeLayer.scale(deltaScale, paper.tool.curser.position);
  if ( ! noSnap) {
    this.snapImage();
  }
}
Background.prototype.scaleTo = function(scale, noSnap) {
  var currentScale = this.getCurrentScale();
  this.scale(scale / currentScale, noSnap);
}
Background.prototype.getCurrentScale = function() {
  var scale = Math.max(this.image.bounds.height / this.focusRect.height, this.image.bounds.width / this.focusRect.width);
  return scale;
}
Background.prototype.getPixelHeight = function() {
  return this.image.bounds.height / this.image.height;
}
Background.prototype.snapImage = function() {
  var tl = this.image.bounds.topLeft;
  var br = this.image.bounds.bottomRight;
  if (tl.x > this.focusRect.bottomRight.x) {
    var delta = new Point(this.focusRect.bottomRight.x - tl.x, 0);
    this.move(delta, true);
  }
  if (tl.y > this.focusRect.bottomRight.y) {
    var delta = new Point(0, this.focusRect.bottomRight.y - tl.y);
    this.move(delta, true);
  }
  if (br.x < this.focusRect.topLeft.x) {
    var delta = new Point(this.focusRect.topLeft.x - br.x, 0);
    this.move(delta, true);
  }
  if (br.y < this.focusRect.topLeft.y) {
    var delta = new Point(0, this.focusRect.topLeft.y - br.y);
    this.move(delta, true);
  }

  var currentScale = this.getCurrentScale();
  if (currentScale > this.maxScale) {
    this.scaleTo(this.maxScale, true);
  } else if (currentScale < this.minScale) {
    this.scaleTo(this.minScale, true);
  }
}
Background.prototype.focus = function(annotation) {
  this.lastFocus = annotation;
  var target = this.image.bounds;
  if (annotation) {
    target = annotation.boundary.bounds;
    if (target.height == 0 && target.width == 0) {
      target = this.image.bounds;
    }
  }
  var height = Math.max(1, target.height);
  var width = Math.max(1, target.width);
  var scale = Math.min(this.image.bounds.height/height, this.image.bounds.width/width);
  this.moveTo(target.center);
  this.scaleTo(Math.min(this.focusMaxScale, scale));
}
Background.prototype.focusPoint = function(point) {
  this.moveTo(point);
  this.scaleTo(this.focusMaxScale);
}
Background.prototype.align = function(annotation) {
  var img_bounds = this.image.bounds;
  var ann_bounds = annotation.raster.bounds;
  var img_scale = img_bounds.height / this.image.height;
  var ann_scale = ann_bounds.height / annotation.raster.height;
  annotation.translate(img_bounds.topLeft - ann_bounds.topLeft);
  annotation.scale(img_scale / ann_scale, img_bounds.topLeft);
}
Background.prototype.setTempImage = function(imageData) {
  if (this.tempImage) {
    this.tempImage.remove();
  }
  this.tempImage = this.image.clone();
  this.tempImage.blendMode = 'normal';
  this.tempImage.setImageData(imageData, new Point(0,0));
  this.tempImage.insertAbove(this.image);
}
Background.prototype.removeTempImage = function() {
  this.tempImage.remove();
}
Background.prototype.addListeners = function() {
  var canvas = document.getElementById('toolCanvas');
  canvas.addEventListener('wheel', function(e) {
    var deltaY = e.deltaY;
    if (e.ctrlKey) {
      deltaY *= 2;
    }
    var scale = Math.abs(1 - 0.005 * deltaY);
    background.scale(scale);
    paper.tool.refreshTool();
    e.preventDefault();
  });
}

//
// Point to Pixel
//
Background.prototype.getPixel = function(point) {
  var bounds = this.image.bounds;
  var size = this.image.size;
  var tl = bounds.topLeft;

  var x = (point.x - tl.x) * (size.height/ bounds.height) - 0.5;
  var y = (point.y - tl.y) * (size.height/ bounds.height) - 0.5;
  return new Point(x, y);
}
Background.prototype.getPoint = function(pixel) {
  var bounds = this.image.bounds;
  var size = this.image.size;
  var tl = bounds.topLeft;

  var x = (pixel.x + 0.5) * (bounds.height / size.height) + tl.x;
  var y = (pixel.y + 0.5) * (bounds.height / size.height) + tl.y;
  return new Point(x, y);
}
Background.prototype.toPixelSpace = function(shape) {
  var bounds = this.image.bounds;
  var size = this.image.size;
  var tl = bounds.topLeft;

  shape.translate(-tl);
  shape.scale(size.height / bounds.height, new Point(0, 0));
  shape.translate(new Point(-0.5, -0.5));
}
Background.prototype.toPointSpace = function(shape) {
  var bounds = this.image.bounds;
  var size = this.image.size;
  var tl = bounds.topLeft;

  shape.translate(new Point(0.5, 0.5));
  shape.scale(bounds.height / size.height, new Point(0, 0));
  shape.translate(tl);
}

//
// Shape to Pixel
//
Background.prototype.getAllPixels = function(shape) {
  var pixels0 = this.getBoundaryPixels(shape);
  var pixels1 = this.getInteriorPixels(shape);
  return pixels0.concat(pixels1);
}
Background.prototype.getInteriorPixels = function(shape) {
  var clone = shape.clone();
  clone.strokeWidth = 0;
  clone.fillColor = "red";
  clone.opacity = 1;

  background.toPixelSpace(clone);
  clone.translate(new Point(0.5, 0.5)); // Align for rasterize.
  var raster = clone.rasterize(paper.view.resolution / window.devicePixelRatio);
  var tl = raster.bounds.topLeft;
  raster.opacity = 1;
  clone.remove();
  raster.remove();

  var pixels = [];
  if (raster.height == 0 || raster.width == 0) {
    return pixels;
  }
  var imageData = raster.getImageData();
  var mask = imageDataToMask(imageData);
  for (var x = 0; x < mask.shape[1]; x++) {
    for (var y = 0; y < mask.shape[0]; y++) {
      if (mask.get(y,x) != 0) {
        pixels.push(new Point(x,y) + tl);
      }
    }
  }

  return pixels;
}
Background.prototype.getBoundaryPixels = function(path) {
  var pixels = [];
  // CompoundPath
  if (path.children) {
    for (var i = 0; i < path.children.length; i++) {
      pixels = pixels.concat(background.getBoundaryPixels(path.children[i]));
    }
    return pixels;
  }
  // Shape
  if ( ! path.getPointAt) {
    path = path.toPath();
    path.remove();
  }
  // Path
  var path_pixel = path.clone();
  path_pixel.remove();
  background.toPixelSpace(path_pixel);
  for (var i = 0; i < path_pixel.length; i = i + 0.1) {
    var pixel = path_pixel.getPointAt(i);
    pixels.push(pixel);
  }
  return pixels;
}

//
// Exports
//
function onResize(event) {
  background.setFocusRect();
}
Background.prototype.increaseBrightness = function() {
  background.filter.fillColor += 0.05;
  if (background.filter.fillColor.gray > 1) {
    background.filter.fillColor.gray = 1;
  }
}
Background.prototype.decreaseBrightness = function() {
  background.filter.fillColor -= 0.05;
  if (background.filter.fillColor.gray < 0) {
    background.filter.fillColor.gray = 0;
  }
}
window.background = new Background();
paper.view._context.imageSmoothingEnabled = false; // Pixelates background
