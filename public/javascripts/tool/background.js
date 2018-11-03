/**
 * Annotation tool powered by PaperJS.
 */

function Background() {
  this.canvas = document.getElementById('toolCanvas');
  this.canvasCenter = new Point(this.canvas.width/2, this.canvas.height/2 + 50);

  var tl = this.canvasCenter - new Point(350, 220);
  var br = this.canvasCenter + new Point(350, 220);
  this.focusRect = new Rectangle(tl, br);
  this.focusMaxScale = 5; // Points per pixel
  this.focusMinScale = 0.4; // Points per pixel

  var defaultImage = new Path.Rectangle(this.focusRect);
  this.image = defaultImage.rasterize();
  defaultImage.remove();

  this.image.sendToBack();
  this.border = new Path.Rectangle(this.image.bounds);
  this.border.strokeColor = "silver";
  this.border.strokeWidth = 20;

  this.addGestures();
}
Background.prototype.addGestures = function() {
  this.canvas.addEventListener('wheel', function(e) {
    e.preventDefault();
    if (e.ctrlKey) {
      var scale = -0.01 * e.deltaY + 1;
      background.scale(scale);
    } else {
      var delta = new Point(e.deltaX, e.deltaY);
      background.move(delta);
    }
  });
}
Background.prototype.setImage = function(image) {
  var raster = new Raster(image);
  raster.position = this.canvasCenter;
  raster.onLoad = function() {
    background.image.remove();
    background.border.remove();

    background.image = raster;
    background.border = new Path.Rectangle(background.image.bounds);
    background.border.strokeColor = "silver";
    background.border.strokeWidth = 20;

    background.image.sendToBack();
    background.border.sendToBack();
    for (var i = 0; i < annotations.length; i++) {
      background.align(annotations[i]);
    }
    background.focus();
  }
}
Background.prototype.setTempImage = function(imageData) {
  if (this.tempImage) {
    this.tempImage.remove();
  }
  this.tempImage = this.image.clone();
  this.tempImage.setImageData(imageData, new Point(0,0));
  this.tempImage.insertAbove(this.image);
}
Background.prototype.removeTempImage = function() {
  this.tempImage.remove();
}
Background.prototype.move = function(delta, noSnap) {
  paper.project.activeLayer.translate(delta);
  if ( ! noSnap) {
    this.snapImage();
  }
}
Background.prototype.scale = function(scale, point, noSnap) {
  if (point == null || (point.x == 0 && point.y == 0)) {
    point = this.canvasCenter;
  }
  paper.project.activeLayer.scale(scale, point);
  if ( ! noSnap) {
    this.snapImage();
  }
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

  var scale = this.image.bounds.height / this.image.height;
  if (scale > this.focusMaxScale) {
    this.scale(this.focusMaxScale / scale, this.canvasCenter, true);
  }
  if (scale < this.focusMinScale) {
    this.scale(this.focusMinScale / scale, this.canvasCenter, true);
  }
}
Background.prototype.center = function(point) {
    var x = this.canvasCenter.x;
    var y = this.canvasCenter.y;
    var dx = x - point.x;
    var dy = y - point.y;
    this.move(new Point(dx,dy));
}
Background.prototype.focus = function(annotation) {
  this.lastFocus = annotation;
  var target = this.image.bounds;
  if (annotation) {
    if (annotation.boundary.bounds.height > 0 && annotation.boundary.bounds.width > 0) {
      target = annotation.boundary.bounds;
    }
  }
  var scale = Math.min(this.focusRect.height/target.height, this.focusRect.width/target.width);
  this.center(target.center);
  this.scale(scale);
}
Background.prototype.focusPoint = function(point) {
  var scale = (this.image.height / this.image.bounds.height) * this.focusMaxScale;
  this.scale(scale, point);
  this.center(point);
}
Background.prototype.align = function(annotation) {
  var img_bounds = this.image.bounds;
  var ann_bounds = annotation.raster.bounds;
  var img_scale = img_bounds.height / this.image.height;
  var ann_scale = ann_bounds.height / annotation.raster.height;
  annotation.translate(img_bounds.topLeft - ann_bounds.topLeft);
  annotation.scale(img_scale / ann_scale, img_bounds.topLeft);
}

Background.prototype.getPixel = function(point) {
  var bounds = this.image.bounds;
  var size = this.image.size;
  var tl = bounds.topLeft;

  var x = (point.x - tl.x) * (size.height/ bounds.height) - 0.5;
  var y = (point.y - tl.y) * (size.height/ bounds.height) - 0.5;
  return new Point(Math.round(x), Math.round(y));
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

window.background = new Background();
paper.view._context.imageSmoothingEnabled = false; // Pixelates background
