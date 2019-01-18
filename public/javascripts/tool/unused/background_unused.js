

Background.prototype.focusPoint = function(point) {
  this.moveTo(point);
  this.scaleTo(this.focusMaxScale);
}

//
// Shape to Pixel
//
Background.prototype.getAllPixels = function(shape) {
  console.time("boundary");
  var pixels0 = this.getBoundaryPixels(shape);
  console.timeEnd("boundary");
  console.time("interior");
  var pixels1 = this.getInteriorPixels(shape);
  console.timeEnd("interior");
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