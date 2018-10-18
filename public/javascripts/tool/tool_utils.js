

function maskToRLE(mask) {

}

function rleToMask(rle) {
  var height = rle["height"];
  var width = rle["width"];
  var counts = rle["counts"].split("#");
  var mask = [];
  var b = 0;
  for (var i = 0; i < counts.length; i++) {
      for (var j = 0; j < counts[i]; j++) {
          mask.push(b);
      }
      if (b == 0) {
          b = 1;
      } else {
          b = 0;
      }
  }
  var mask = nj.array(mask).reshape(height, width);
  return mask;
}

function maskToImageData(mask, color) {
  if (nj.max(mask) <= 1) {
    mask = mask.multiply(255);
  }
  // Mask to raster
  var r = nj.multiply(mask, color.red);
  var g = nj.multiply(mask, color.green);
  var b = nj.multiply(mask, color.blue);
  var a = mask;
  var color_mask = nj.stack([r, g, b, a], -1);

  imageData = arrayToImageData(color_mask);
  return imageData;
}

function imageDataToMask(imageData) {
  var mat = cv.matFromImageData(imageData);
  var array = matToArray(mat);
  var mask = array.slice(null,null,3);
  if (nj.max(mask) > 1) {
    mask = mask.divide(nj.max(mask));
  }
  return mask;
}

function arrayToImageData(array) {
  var cv = document.createElement('canvas');
  var ctx = cv.getContext('2d');
  cv.height = array.shape[0];
  cv.width = array.shape[1];
  nj.images.save(array, cv);
  imageData = ctx.getImageData(0,0,array.shape[1], array.shape[0]);
  return imageData;
}
function matToImageData(mat) {
  var imageData = new ImageData(new Uint8ClampedArray(mat.data), mat.cols, mat.rows);
  return imageData;
}
function matToArray(mat) {
  var channels = mat.data.length / (mat.rows * mat.cols);
  var array = nj.array(Array.from(mat.data));
  if (channels == 1) {
    array = array.reshape(mat.rows, mat.cols);
  } else {
    array = array.reshape(mat.rows, mat.cols, channels);
  }
  return array;
}

function findBoundariesOpenCV(imageData) {
  var src = cv.matFromImageData(imageData);
  var dst = cv.Mat.zeros(src.cols, src.rows, cv.CV_8UC3);
  cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
  cv.threshold(src, src, 1, 255, cv.THRESH_BINARY);
  var contours = new cv.MatVector();
  var hierarchy = new cv.Mat();
  // // You can try more different parameters
  cv.findContours(src, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_NONE);

  var boundaries = [];
  for (var i = 0; i < contours.size(); i++) {
    var cnt = contours.get(i);
    if (cv.contourArea(cnt) > 5) {
      var bnd = [];
      for (var j = 0; j < cnt.rows; j++) {
        bnd.push([cnt.data32S[j*2], cnt.data32S[j*2+1]])
      }
      boundaries.push(bnd);
    }
    cnt.delete();
  }
  src.delete();
  dst.delete();
  contours.delete();
  hierarchy.delete();
  return boundaries;
}