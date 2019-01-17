/**
 * Annotation tool powered by PaperJS.
 */

function Background() {
  this.setFocusRect();
  this.clearImage();
  this.makeFilter();
  this.addListeners();

  this.focusMaxScale = 4;
  this.maxScale = 8;
  this.minScale = 0.5;
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
Background.prototype.move = function(delta) {
  paper.project.activeLayer.translate(delta);
  this.snapBounds();
}
Background.prototype.moveTo = function(center) {
    var dx = this.viewCenter.x - center.x;
    var dy = this.viewCenter.y - center.y;
    this.move(new Point(dx,dy));
}
Background.prototype.scale = function(deltaScale, center) {
  if ( ! center) {
    center = this.viewCenter;
  }
  paper.project.activeLayer.scale(deltaScale, center);
  this.snapScale(center);
  this.snapBounds();
}
Background.prototype.scaleTo = function(scale) {
  var currentScale = this.getCurrentScale();
  this.scale(scale / currentScale);
}
Background.prototype.getCurrentScale = function() {
  // Defines what scale means
  var scale = Math.max(this.image.bounds.height / this.focusRect.height, this.image.bounds.width / this.focusRect.width);
  return scale;
}
Background.prototype.snapBounds = function() {
  var tl = this.image.bounds.topLeft;
  var br = this.image.bounds.bottomRight;
  var delta = new Point(0,0);
  if (tl.x > this.viewCenter.x) {
    delta += new Point(this.viewCenter.x - tl.x, 0);
  }
  if (tl.y > this.viewCenter.y) {
    delta += new Point(0, this.viewCenter.y - tl.y);
  }
  if (br.x < this.viewCenter.x) {
    delta += new Point(this.viewCenter.x - br.x, 0);
  }
  if (br.y < this.viewCenter.y) {
    delta += new Point(0, this.viewCenter.y - br.y);
  }
  paper.project.activeLayer.translate(delta);
}
Background.prototype.snapScale = function(center) {
  var currentScale = this.getCurrentScale();
  if (currentScale > this.maxScale) {
    paper.project.activeLayer.scale(this.maxScale / currentScale, center);
  } else if (currentScale < this.minScale) {
    paper.project.activeLayer.scale(this.minScale / currentScale, center);
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
  scale = Math.min(this.focusMaxScale, scale);
  // Move before scaling
  this.moveTo(target.center);
  this.scaleTo(scale);
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
    var center = new Point(e.offsetX, e.offsetY);
    background.scale(scale, center);
    paper.tool.curser.position = center;
    paper.tool.refreshTool();
    e.preventDefault();
  });
}
Background.prototype.getPixelHeight = function() {
  return this.image.bounds.height / this.image.height;
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
