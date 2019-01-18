

function maskToRLE(mask) {
  var b = 0;
  var bit = 0;
  var count = 0;
  var counts = [];
  var list = mask.tolist();
  for (var i = 0; i < list.length; i++) {
    for (var j = 0; j < list[i].length; j++) {
      b = list[i][j];
      if (b == bit) {
        count += 1;
      } else {
        counts.push(count);
        count = 1;
        bit = b;
      }
    }
  }
  counts.push(count);

  var rle = {};
  rle["height"] = mask.shape[0];
  rle["width"] = mask.shape[1];
  rle["counts"] = counts.join("#");
  return rle;
}

function rleToMask(rle) {
  console.time("rleToMask");
  var height = rle["height"];
  var width = rle["width"];
  var counts = rle["counts"].split("#");
  var mask = [];
  var b = 0;
  for (var i = 0; i < counts.length; i++) {
      for (var j = 0; j < counts[i]; j++) {
          mask.push(b);
      }
      b = (b == 0) ? 1 : 0;
  }
  var mask = nj.uint8(mask).reshape(height, width);
  console.timeEnd("rleToMask");
  return mask;
}

function imageDataToMask(imageData) {
  var mask = [];
  for (var i = 3; i < imageData.data.length; i = i+4) {
    if (imageData.data[i] > 0) {
      mask.push(1);
    } else {
      mask.push(0);
    }
  }
  return nj.uint8(mask).reshape(imageData.height, imageData.width);
}

function getImageData(image) {
    var cv = document.createElement('canvas');
    var ctx = cv.getContext('2d');
    cv.height = image.height;
    cv.width = image.width;
    ctx.drawImage(image, 0, 0, image.width, image.height);
    var imageData = ctx.getImageData(0, 0, image.width, image.height);
    return imageData;
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