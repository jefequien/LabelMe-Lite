
Annotation.prototype.setMask = function(mask) {
  this.raster.size = new Size(mask.shape[1], mask.shape[0]);
  this.rasterinv.size = new Size(mask.shape[1], mask.shape[0]);
  background.align(this);

  console.time("updateRasterWithMask");
  setRasterWithMask(this.raster, this.color, mask);
  console.timeEnd("updateRasterWithMask");
  this.updateBoundary();
  this.updateRaster();
}
Annotation.prototype.getMask = function() {
  var imageData = this.raster.getImageData();
  var mask = imageDataToMask(imageData);
  return mask;
}

function setRasterOld(raster, color, mask) {
  var mask = mask.multiply(255);
  var r = nj.multiply(mask, color.red);
  var g = nj.multiply(mask, color.green);
  var b = nj.multiply(mask, color.blue);
  var a = mask;
  var color_mask = nj.stack([r, g, b, a], -1);
  var imageData = arrayToImageData(color_mask);

  raster.setImageData(imageData, new Point(0, 0));
}

Annotation.prototype.unitePixels = function(pixels) {
  editRasterPixels(this.raster, pixels, this.color);
  editRasterPixels(this.rasterinv, pixels, new Color(0,0,0,0));
}
Annotation.prototype.subtractPixels = function(pixels) {
  editRasterPixels(this.raster, pixels, new Color(0,0,0,0));
  editRasterPixels(this.rasterinv, pixels, this.colorinv);
}
function editRasterPixels(raster, pixels, color) {
  console.time("editRasterPixels");
  var imageData = raster.getImageData();
  for (var i = 0; i < pixels.length; i++) {
    setPixelColor(imageData, pixels[i], color);
  }
  raster.setImageData(imageData, new Point(0, 0));
  console.timeEnd("editRasterPixels");
}
function getPixelColor(imageData, pixel) {
  var x = Math.round(pixel.x);
  var y = Math.round(pixel.y);
  var p = (y * imageData.width + x) * 4;
  var color = new Color();
  color.red = imageData.data[p] / 255;
  color.green = imageData.data[p+1]/ 255;
  color.blue = imageData.data[p+2] / 255;
  color.alpha = imageData.data[p+3] / 255;
  return color;
}
function setRasterWithPath(raster, color, path) {
  clearRaster(raster);

  var path_raster = this.rasterize(path, color);
  path_raster.remove();
  if (path_raster.height == 0 || path_raster.width == 0) {
    return;
  }
  var imageData = path_raster.getImageData();
  var tl = path_raster.bounds.topLeft;
  raster.setImageData(imageData, tl);
}
function setRasterWithMask(raster, color, mask) {
  var cv = document.createElement('canvas');
  var ctx = cv.getContext('2d');
  var imageData = ctx.getImageData(0,0,mask.shape[1], mask.shape[0]);

  var list = mask.tolist();
  for (var y = 0; y < list.length; y++) {
    for (var x = 0; x < list[y].length; x++) {
      b = list[y][x];
      if (b != 0) {
        var p = (y * list[y].length + x) * 4;
        imageData.data[p] = color.red * 255;
        imageData.data[p+1] = color.green * 255;
        imageData.data[p+2] = color.blue * 255;
        imageData.data[p+3] = color.alpha * 255;
      }
    }
  }
  raster.setImageData(imageData, new Point(0, 0));
}