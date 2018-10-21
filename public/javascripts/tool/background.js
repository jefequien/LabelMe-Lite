/**
 * Annotation tool powered by PaperJS.
 */

function Background() {
  this.canvas = document.getElementById('toolCanvas');
  this.canvas_center = new Point(this.canvas.width/2, this.canvas.height/2);
  this.max_height = 400;
  this.max_width = 600;

  var rect = new Path.Rectangle(new Point(0,0), new Point(500, 400));
  rect.position = this.canvas_center;
  rect.strokeColor = "black";
  rect.strokeWidth = 5;

  this.image = rect.rasterize();
  this.image.sendToBack();
  rect.remove();
}
Background.prototype.setImage = function(image) {
  var raster = new Raster(image);
  raster.position = this.canvas_center;
  raster.onLoad = function() {
    background.image.remove();
    background.image = raster;
    background.image.sendToBack();
    for (var i = 0; i < annotations.length; i++) {
      background.align(annotations[i]);
    }
    background.focus();
  }
}
Background.prototype.setTempImage = function(imageData) {
  this.tempImage = this.image.clone();
  this.tempImage.setImageData(imageData, new Point(0,0));
  this.tempImage.insertAbove(this.image);
}
Background.prototype.removeTempImage = function() {
  this.tempImage.remove();
}
Background.prototype.move = function(delta) {
  paper.project.activeLayer.translate(delta);
}
Background.prototype.scale = function(scale, point) {
  if (point == null) {
    point = this.canvas_center;
  }
  paper.project.activeLayer.scale(scale, point);
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
  var scale = Math.min(background.max_height/bounds.height, background.max_width/bounds.width);
  background.center(bounds.center);
  background.scale(scale);
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
function zoomIn(center) {
  background.scale(1.25, center);
}
function zoomOut(center) {
  background.scale(0.8, center);
}
function fitScreen() {
  background.focus(paper.tool.annotation);
}

window.background = new Background();
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;
window.fitScreen = fitScreen;
paper.view._context.imageSmoothingEnabled = false; // Pixelates background