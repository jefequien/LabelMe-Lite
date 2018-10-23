var brush = new Brush();

function Brush() {
    this.maxBrushSize = 100;
    this.vis = false;
}
Brush.prototype.toggleVisualize = function() {
    if (this.vis) {
        this.vis = false;
        background.removeTempImage();
    } else {
        if (this.top) {
            this.vis = true;
            // Visualize top
            var vis = nj.multiply(this.top, 255/nj.max(this.top));
            var imageData = arrayToImageData(vis);
            background.setTempImage(imageData);
        }
    }
}

Brush.prototype.getNearestPixels = function(point, num) {
    var p = clamp(this.top, [point])[0];
    p = JSON.stringify(p);

    var pixels = new Set();
    var queue = new goog.structs.PriorityQueue();
    var dists = {};

    queue.enqueue(0, p);
    dists[p] = 0;
    while(pixels.size < Math.min(this.maxBrushSize, num)) {
        var p = queue.dequeue();
        if (pixels.has(p)) {
            continue;
        }
        var p_dist = dists[p];
        var n_dists = getDistancesToNeighbors(this.top, JSON.parse(p));
        for (var n in n_dists) {
            var n_dist = n_dists[n] + p_dist;
            var n_dist_old = dists[n];
            if (n_dist_old == null || n_dist < n_dist_old) {
                dists[n] = n_dist;
                queue.enqueue(n_dist, n);
            }
        }
        pixels.add(p);
    }
    var list = [];
    for (var p of pixels) {
        list.push(JSON.parse(p));
    }
    return list;
}

function clamp(array, points) {
    var clamped = [];
    for (var i = 0; i < points.length; i++) {
        var p = [Math.round(points[i][0]), Math.round(points[i][1])];
        var x = Math.max(0, Math.min(p[0], array.shape[1]-1));
        var y = Math.max(0, Math.min(p[1], array.shape[0]-1));
        clamped.push([x,y]);
    }
    return clamped;
}

function getDistancesToNeighbors(top, p) {
    var h = top.shape[0];
    var w = top.shape[1];
    var dists = {};
    var dirs = [[0,1], [0,-1], [1,0], [-1,0], [1,1], [1,-1], [-1,1], [-1,-1]];
    for (var i = 0; i < dirs.length; i++) {
        var d = dirs[i];
        var x = d[0] + p[0];
        var y = d[1] + p[1];
        if (x >= 0 && x < w && y >= 0 && y < h) {
            var c = Math.sqrt(d[0]*d[0] + d[1]*d[1]);
            var key = JSON.stringify([x,y]);
            dists[key] = (top.get(y,x) + 0.2) * c;
        }
    }
    return dists;
}

//
// Topography
//
Brush.prototype.setImage = function(image_url) {
    var img = new Image();
    img.crossOrigin = "anonymous";
    img.src = image_url;
    img.onload = function() {
        var imageData = getImageData(this);
        brush.computeTopography(imageData);
    }
}
Brush.prototype.computeTopography = function(imageData) {
    var src = cv.matFromImageData(imageData);
    var dst = new cv.Mat();
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
    cv.Laplacian(src, dst, cv.CV_8U, 1, 1, 0, cv.BORDER_DEFAULT);
    // cv.Canny(src, dst, 50, 100, 3, false);
    // var ksize = new cv.Size(3, 3);
    // cv.GaussianBlur(dst, dst, ksize, 0);
    var top = matToArray(dst);
    src.delete();
    dst.delete();
    top = nj.divide(top, nj.max(top));
    // top = nj.multiply(top, top);
    top = nj.sqrt(top);
    this.top = top;
}

window.brush = brush;