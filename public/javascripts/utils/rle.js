
function loadRLE(rle, color) {
  var height = rle["size"][0];
  var width = rle["size"][1];
  var cnts = rleFrString(rle["counts"]);
  var imageData = new ImageData(width, height);

  var sum = 0;
  for (var i = 0; i < cnts.length; i++) {
    if (i % 2 == 0) {
      sum += cnts[i];
    } else {
      for (var j = sum; j < sum + cnts[i]; j++) {
        var y = j % height;
        var x = Math.floor(j / height);
        var index = (y * width + x) * 4;
        imageData.data[index] = color[0];
        imageData.data[index+1] = color[1];
        imageData.data[index+2] = color[2];
        imageData.data[index+3] = color[3];
      }
      sum += cnts[i];
    }
  }
  return imageData;
}

function getRLE(imageData, bbox) {
  var height = imageData.height;
  var width = imageData.width;
  var tl = {x: bbox[0], y:bbox[1]};
  var br = {x: bbox[0]+bbox[2], y:bbox[1]+bbox[3]};

  var cnts = [tl.x * height, 0];
  for (var x = tl.x; x <= br.x; x++) {
    // Handle column
    var run_start = 0;
    var last_b = 0;
    for (var y = tl.y; y <= br.y; y++) {
      var index = (y * width + x) * 4;
      var b = (imageData.data[index+3] == 0) ? 0 : 1;
      if (b != last_b) {
        cnts.push(y - run_start);
        run_start = y;
        last_b = b;
      }
    }
    if (last_b == 1) {
      cnts.push((br.y + 1) - run_start);
      run_start = br.y + 1;
    }
    cnts.push(height - run_start); // cnt for 0s
    cnts.push(0); // cnt for 1s
  }
  cnts.push((width - (br.x + 1)) * height);

  // Remove zeros
  cnts_compressed = [];
  while (cnts.length > 0) {
    var c = cnts.shift();
    if (c == 0 && cnts_compressed.length > 0 && cnts.length > 0) {
      cnts_compressed[cnts_compressed.length-1] += cnts.shift();
    } else {
      cnts_compressed.push(c);
    }
  }
  if (cnts_compressed[cnts_compressed.length-1] == 0) {
    cnts_compressed.pop();
  }

  var rle = {};
  rle["size"] = [height, width];
  rle["counts"] = rleToString(cnts_compressed);
  return rle;
}

function rleFrString(s) {
  var m = 0;
  var p = 0;
  var cnts = [];
  while (p < s.length) {
    var x = 0;
    var k = 0;
    var c = 0;
    var more = 1;
    while (more) {
      c = s.charCodeAt(p) - 48;
      x = x | ((c & 0x1f) << 5*k);
      more = c & 0x20;
      p += 1;
      k += 1;
      if (!more && (c & 0x10)) {
        x = x | (-1 << 5*k);
      }
    }
    if (m > 2) {
      x += cnts[m-2];
    }
    m += 1;
    cnts.push(x);
  }
  return cnts;
}
function rleToString(cnts) {
  var s = "";
  for (var i = 0 ; i < cnts.length; i++) {
    var x = cnts[i];
    if (i > 2) {
      x -= cnts[i-2];
    }
    var more = 1;
    while (more) {
      c = x & 0x1f;
      x >>= 5;
      more = (c & 0x10) ? x!=-1 : x!=0;
      if(more) {
        c = c | 0x20;
      }
      c += 48;
      s += String.fromCharCode(c);
    }
  }
  return s;
}