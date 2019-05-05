


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
    var bnd = [];
    for (var j = 0; j < cnt.rows; j++) {
      bnd.push([cnt.data32S[j*2], cnt.data32S[j*2+1]])
    }
    if (bnd.length > 4) {
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

function getCannyOpenCV(imageData) {
  var src = cv.matFromImageData(imageData);
  var dst = new cv.Mat();
  cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
  // cv.Canny(src, dst, 50, 100, 3, false);
  cv.Laplacian(src, dst, cv.CV_8U, 1, 1, 0, cv.BORDER_DEFAULT);
  cv.cvtColor(dst, dst, cv.COLOR_GRAY2RGBA);
  var imageData = new ImageData(new Uint8ClampedArray(dst.data), dst.cols, dst.rows);
  src.delete();
  dst.delete();
  return imageData;
}