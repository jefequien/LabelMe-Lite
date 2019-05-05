/**
 * Annotation tool powered by PaperJS.
 */

function Background() {
  this.maxZoom = 12;
  this.minZoom = 0.75;
  this.focusMargin = 2;
  this.focusMaxZoom = 5;
  this.focusMinZoom = 1;

  this.viewPercentage = 0.8;
  this.setViewParameters();
  this.addMouseListeners();

  this.image = new Path();
  this.filter = new Path();
  this.canny = new Path();
  this.setBlankImage();
}
Background.prototype.setViewParameters = function(viewPercentage) {
  if (viewPercentage) {
    this.viewPercentage = viewPercentage;
  }
  this.viewCenter = new Point(paper.view.size) / 2;
  this.viewSize = paper.view.size * this.viewPercentage;
}
Background.prototype.addMouseListeners = function() {
  var canvas = document.getElementById('toolCanvas');
  canvas.addEventListener('wheel', function(e) {
    var deltaY = e.deltaY;
    if (e.ctrlKey) {
      deltaY *= 2;
    }
    var delta = Math.abs(1 - 0.005 * deltaY);
    var center = new Point(e.offsetX, e.offsetY);
    background.scale(delta, center);
    paper.tool.curser.position = center;
    paper.tool.refreshTool();
    e.preventDefault();
  });
}

//
// Set Image
//
Background.prototype.setImage = function(image) {
  this.image.remove();
  this.image = image;
  this.image.sendToBack();

  if (annotations.length == 0) {
    this.image.position = this.viewCenter;
  } else {
    // Align with first annotation
    var ann_bounds = annotations[0].raster.bounds;
    var img_bounds = this.image.bounds;
    this.image.translate(ann_bounds.topLeft - img_bounds.topLeft);
    this.image.scale(ann_bounds.height / img_bounds.height, ann_bounds.topLeft);
  }
  this.setFilter();
  this.setCanny();
}
Background.prototype.setBlankImage = function(size) {
  if ( ! size || size.width == 0 || size.height == 0) {
    size = this.viewSize;
  }
  var rect = new Path.Rectangle(size);
  var image = rect.rasterize(paper.view.resolution / window.devicePixelRatio);
  rect.remove();
  this.setImage(image);
}
Background.prototype.setFilter = function() {
  // Setup filter for adjusting image brightness
  this.image.blendMode = 'hard-light';
  var bounds = this.image.bounds;
  this.filter.segments = [bounds.topLeft, bounds.topRight, bounds.bottomRight, bounds.bottomLeft];
  this.filter.fillColor = new Color(0.5);
  this.filter.sendToBack();
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
Background.prototype.scale = function(delta, center) {
  if ( ! center) {
    center = this.viewCenter;
  }
  paper.project.activeLayer.scale(delta, center);
  this.snapZoom(center);
  this.snapBounds();
}
Background.prototype.scaleTo = function(zoom, center) {
  var currentZoom = Math.max(this.image.bounds.height / this.viewSize.height, this.image.bounds.width / this.viewSize.width);
  this.scale(zoom / currentZoom, center);
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
Background.prototype.snapZoom = function(center) {
  var currentZoom = Math.max(this.image.bounds.height / this.viewSize.height, this.image.bounds.width / this.viewSize.width);
  if (currentZoom > this.maxZoom) {
    paper.project.activeLayer.scale(this.maxZoom / currentZoom, center);
  } else if (currentZoom < this.minZoom) {
    paper.project.activeLayer.scale(this.minZoom / currentZoom, center);
  }
}
Background.prototype.focus = function(annotation) {
  if ( ! annotation) {
    this.focusImage();
    return;
  }
  this.lastFocusedAnnotation = annotation;

  var height = annotation.boundary.bounds.height;
  var width = annotation.boundary.bounds.width;
  var position = annotation.boundary.bounds.center;
  if (height == 0 && width == 0) {
    this.focusImage();
    return;
  }

  var zoom = Math.min(this.image.bounds.height / height, this.image.bounds.width / width);
  zoom /= this.focusMargin;
  zoom = Math.min(Math.max(zoom, this.focusMinZoom), this.focusMaxZoom);
  // Move before scaling
  this.moveTo(position);
  this.scaleTo(zoom);
}
Background.prototype.focusImage = function() {
  this.lastFocusedAnnotation = null;
  this.moveTo(this.image.position);
  this.scaleTo(1);
}
Background.prototype.align = function(annotation) {
  var img_bounds = this.image.bounds;
  var ann_bounds = annotation.raster.bounds;
  annotation.translate(img_bounds.topLeft - ann_bounds.topLeft);
  annotation.scale(img_bounds.height / ann_bounds.height, img_bounds.topLeft);
}

//
// Visualization
//
Background.prototype.setVisible = function(visible) {
  this.image.visible = visible;
  this.filter.visible = visible;
  this.canny.visible = visible;
}
Background.prototype.increaseBrightness = function() {
  this.filter.fillColor += 0.05;
  if (this.filter.fillColor.gray > 1) {
    this.filter.fillColor.gray = 1;
  }
}
Background.prototype.decreaseBrightness = function() {
  this.filter.fillColor -= 0.05;
  if (this.filter.fillColor.gray < 0) {
    this.filter.fillColor.gray = 0;
  }
}

//
// Canny
//
var cannyCache = {};
Background.prototype.setCanny = function() {
  this.canny.remove();

  var cannyData = cannyCache[this.image.source];
  if ( ! cannyData) {
    cannyData = getCannyOpenCV(this.image.getImageData());
    cannyCache[this.image.source] = cannyData;
  }
  this.canny = this.image.clone();
  this.canny.blendMode = 'normal';
  this.canny.setImageData(cannyData, new Point(0,0));
  this.canny.insertAbove(this.image);
  this.canny.opacity = 0;
}

//
// Exports
//
var backgroundCache = {};
function loadBackground(img) {
  var image_url = getImageURL(img); // See endpoints.js
  if (image_url in backgroundCache) {
    var raster = backgroundCache[image_url];
    project.activeLayer.addChild(raster);

    background.setImage(raster);
  } else {
    var raster = new Raster({
        crossOrigin: 'anonymous',
        source: image_url
    });
    raster.onLoad = function() {
      backgroundCache[image_url] = raster;
      background.setImage(raster);
    }
  }
}

function clearBackground(img) {
  var size = (img) ? new Size(img.width, img.height) : null;
  background.setBlankImage(size);
}

function onResize(event) {
  background.setViewParameters();
}

window.background = new Background();
window.loadBackground = loadBackground;
window.clearBackground = clearBackground;

paper.view._context.imageSmoothingEnabled = true; // Pixelates background
