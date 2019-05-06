


function toPixelSpace(path, raster) {
  path.translate(-raster.bounds.topLeft);
  path.scale(raster.size.height / raster.bounds.height, new Point(0, 0));
  path.translate(new Point(-0.5, -0.5));
}
function toPointSpace(path, raster) {
  path.translate(new Point(0.5, 0.5));
  path.scale(raster.bounds.height / raster.size.height, new Point(0, 0));
  path.translate(raster.bounds.topLeft);
}
function getPixel(point, raster) {
  var pixel = (point - raster.bounds.topLeft) * (raster.size.height / raster.bounds.height) - new Point(0.5, 0.5);
  return pixel;
}
function getPoint(pixel, raster) {
  var point = (pixel + new Point(0.5, 0.5)) * (raster.bounds.height / raster.size.height) + raster.bounds.topLeft;
  return point;
}


window.toPixelSpace = toPixelSpace;
window.toPointSpace = toPointSpace;
window.getPixel = getPixel;
window.getPoint = getPoint;
