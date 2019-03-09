/**
 * Annotation tool powered by PaperJS.
 */

function Background() {
  this.setFocusRect();
  this.addMouseListeners();

  this.focusMaxScale = 6;
  this.maxScale = 10;
  this.minScale = 0.75;

  this.image = new Path.Rectangle(this.focusRect).rasterize(paper.view.resolution / window.devicePixelRatio);
  this.filter = new Path();
  this.resetFilter();
}
Background.prototype.setFocusRect = function() {
  var h = paper.view.size.height;
  var w = paper.view.size.width;
  this.viewCenter = new Point(0.5 * w, 0.5 * h);
  var tl = this.viewCenter - new Point(0.4 * w, 0.4 * h);
  var br = this.viewCenter + new Point(0.4 * w, 0.4 * h);
  this.focusRect = new Rectangle(tl, br);
}
Background.prototype.resetFilter = function() {
  this.image.blendMode = 'hard-light';
  var path = new Path.Rectangle(this.image.bounds);
  path.remove();
  this.filter.segments = path.segments;
  this.filter.fillColor = new Color(0.5);
  this.filter.sendToBack();
}
Background.prototype.addMouseListeners = function() {
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

  var scale = Math.min(this.image.bounds.height / target.height, this.image.bounds.width / target.width);
  scale = Math.min(this.focusMaxScale, scale);
  // Move before scaling
  this.moveTo(target.center);
  this.scaleTo(scale);
}
Background.prototype.align = function(annotation) {
  var img_bounds = this.image.bounds;
  var ann_bounds = annotation.raster.bounds;
  annotation.translate(img_bounds.topLeft - ann_bounds.topLeft);
  annotation.scale(img_bounds.height / ann_bounds.height, img_bounds.topLeft);
}
Background.prototype.alignSelf = function(annotation) {
  var img_bounds = this.image.bounds;
  var ann_bounds = annotation.raster.bounds;
  this.image.translate(ann_bounds.topLeft - img_bounds.topLeft);
  this.image.scale(ann_bounds.height / img_bounds.height, ann_bounds.topLeft);
}

//
// Used by New tool
// Delete soon
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
//
// Visualization
//
Background.prototype.setVisible = function(visible) {
  this.image.visible = visible;
  this.filter.visible = visible;
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

//
// Exports
//
function loadBackground(image_url, callback) {
  background.image.remove();
  
  var raster = new Raster(image_url);
  raster.position = background.viewCenter;
  raster.sendToBack();
  raster.onLoad = function() {
    background.image.remove();
    background.image = raster;
    if (annotations.length > 0) {
      background.alignSelf(annotations[0]);
    }
    background.resetFilter();

    if (callback) {
      callback();
    }
  }
}

function clearBackground() {
  background.image.remove();
}

function onResize(event) {
  background.setFocusRect();
}

window.background = new Background();
window.loadBackground = loadBackground;
window.clearBackground = clearBackground;

paper.view._context.imageSmoothingEnabled = true; // Pixelates background
