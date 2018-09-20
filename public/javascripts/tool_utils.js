
function maskToRLE(mask) {

}

function rleToMask(rle) {
    var height = rle["height"];
    var width = rle["width"];
    var counts = rle["counts"];
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

function arrayToImageData(array) {
  var cv = document.createElement('canvas');
  var ctx = cv.getContext('2d');
  cv.height = array.shape[0];
  cv.width = array.shape[1];
  nj.images.save(array, cv);
  image_data = ctx.getImageData(0,0,array.shape[1], array.shape[0]);
  return image_data;
}

function imageDataToArray(imageData) {
  var h = imageData.height;
  var w = imageData.width;
  var array = nj.array(Array.from(imageData.data));
  var array = array.reshape([h,w,4]);
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
  cv.findContours(src, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

  var boundaries = [];
  for (var i = 0; i < contours.size(); i++) {
    var cnt = contours.get(i);
    if (cv.contourArea(cnt) > 10) {
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