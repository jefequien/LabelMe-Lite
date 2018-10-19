/**
 * Annotation tool powered by PaperJS.
 */
function Background() {
  this.canvas = document.getElementById('toolCanvas');
  this.canvas_center = new Point(this.canvas.width/2, this.canvas.height/2);
  this.max_height = 500;
  this.max_width = 700;
  this.fixed = false;
}
Background.prototype.setImage = function(image) {
  if (background.image) {
    background.image.remove();
  }

  background.image = new Raster(image);
  background.image.sendToBack();
  for (var i = 0; i < annotations.length; i++) {
    background.align(annotations[i]);
  }
  background.focus();
}
Background.prototype.setImageData = function(imageData) {
  this.image.setImageData(imageData, new Point(0,0));
}
Background.prototype.move = function(delta) {
  if ( ! this.fixed) {
    paper.project.activeLayer.translate(delta);
  }
}
Background.prototype.scale = function(ratio) {
  paper.project.activeLayer.scale(ratio, this.canvas_center);
}
Background.prototype.center = function(point) {
    var x = this.canvas_center.x;
    var y = this.canvas_center.y;
    var dx = x - point.x;
    var dy = y - point.y;
    this.move(new Point(dx,dy));
}
Background.prototype.focus = function(annotation) {
  var bounds = background.image.bounds;
  if (annotation) {
    bounds = annotation.boundary.bounds;
  }
  var ratio = Math.min(background.max_height/bounds.height, background.max_width/bounds.width);
  background.center(bounds.center);
  background.scale(ratio);
}
Background.prototype.align = function(annotation) {
  var img_bounds = this.image.bounds;
  var ann_bounds = annotation.raster.bounds;
  annotation.translate(img_bounds.topLeft - ann_bounds.topLeft);
  annotation.scale(img_bounds.height / ann_bounds.height, img_bounds.topLeft);
}

Background.prototype.getPixel = function(point) {
  var bounds = this.image.bounds;
  var scale = bounds.height / this.image.height;
  var pixelX = (point.x - bounds.left) / scale - 0.5;
  var pixelY = (point.y - bounds.top) / scale - 0.5;
  return new Point(Math.round(pixelX), Math.round(pixelY));
}
Background.prototype.getPoint = function(pixel) {
  var bounds = this.image.bounds;
  var scale = bounds.height / this.image.height;
  var pointX = (pixel.x + 0.5) * scale + bounds.left;
  var pointY = (pixel.y + 0.5) * scale + bounds.top;
  return new Point(pointX, pointY);
}
Background.prototype.toPixelSpace = function(shape) {
  var delta = this.image.bounds.topLeft;
  var scale = this.image.height / this.image.bounds.height;
  shape.translate(-delta);
  shape.scale(scale, new Point(0,0));
  shape.translate(new Point(-0.5,-0.5));
}
Background.prototype.toPointSpace = function(shape) {
  var delta = this.image.bounds.topLeft;
  var scale = this.image.bounds.height / this.image.height;
  shape.translate(new Point(0.5,0.5));
  shape.scale(scale, new Point(0,0));
  shape.translate(delta);
}


//
// Exports
//
function zoomIn() {
  background.scale(1.25);
}
function zoomOut() {
  background.scale(0.8);
}
function fitScreen() {
  background.focus();
}

window.background = new Background();
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;
window.fitScreen = fitScreen;
paper.view._context.imageSmoothingEnabled = false; // Pixelates background
