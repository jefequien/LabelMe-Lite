

var scissors = new Scissors();

function Scissors() {
    this.allParents = {};
    this.worker = newWorker();
}
Scissors.prototype.toggle = function() {
    if (this.active) {
        this.active = false;
        background.removeTempImage();
    } else {
        if (this.top) {
            this.active = true;

            // Visualize top
            var vis = nj.multiply(this.top, 255/nj.max(this.top));
            var imageData = arrayToImageData(vis);
            background.setTempImage(imageData);
        } else {
            console.log("Could not activate scissors.");
        }
    }
}
Scissors.prototype.setImage = function(image_url) {
    var img = new Image();
    img.crossOrigin = "anonymous";
    img.src = image_url;
    img.onload = function() {
        var imageData = getImageData(this);
        scissors.top = computeTopography(imageData);
        scissors.allParents = {};
    }
}

Scissors.prototype.getPath = function(start, end) {
    var preprocessed = this.preprocess(start, end);
    var root = preprocessed.root;
    var point = preprocessed.point;

    var parents = this.allParents[JSON.stringify(root)];
    if (parents) {
        if ( ! parents.completed) {
            this.sendTaskToWorker(root);
        }
        var path = this.getPathToRoot(parents.map, point);
        path.reverse();
        if (pointInPoints(path[0], root)) {
            if (path.length == 1) {
                path.push(path[0]);
            }
            return path;
        }
    } else {
        this.sendTaskToWorker(root);
    }
    return null;
}

Scissors.prototype.getPathToRoot = function(map, p) {
    var path = [p];
    while (true) {
        var x = map.get(p[1], p[0], 0);
        var y = map.get(p[1], p[0], 1);
        if (x == -1 && y == -1) {
            break; // Done
        } else if (x == null || y == null) {
            console.log("BUG!")
            break;
        }
        p = [x,y];
        path.push(p);
    }
    return path;
}

//
// Preprocess
//
Scissors.prototype.preprocess = function(start, end) {
    if ( ! Array.isArray(start[0])) {
        start = [start];
    }
    var point = this.clamp([end])[0];
    var root = this.clip(start);
    if (root.length == 0) {
        root = this.clamp(start);
    }
    return {"root": root, "point": point};
}
Scissors.prototype.clamp = function(points) {
    var clamped = [];
    for (var i = 0; i < points.length; i++) {
        var p = [Math.round(points[i][0]), Math.round(points[i][1])];
        var x = Math.max(0, Math.min(p[0], this.top.shape[1]-1));
        var y = Math.max(0, Math.min(p[1], this.top.shape[0]-1));
        clamped.push([x,y]);
    }
    return clamped;
}
Scissors.prototype.clip = function(points) {
    var clipped = [];
    for (var i = 0; i < points.length; i++) {
        var p = [Math.round(points[i][0]), Math.round(points[i][1])];
        var x = Math.max(0, Math.min(Math.round(p[0]), this.top.shape[1]-1));
        var y = Math.max(0, Math.min(Math.round(p[1]), this.top.shape[0]-1));
        if (p[0] == x && p[1] == y) {
            clipped.push([x,y]);
        }
    }
    return clipped;
}


Scissors.prototype.sendTaskToWorker = function(root) {
    var task = JSON.stringify({"root": root, "top": this.top});
    if (this.worker.task != task) {
        this.worker.terminate();
        this.worker = newWorker();
        this.worker.postMessage(task);
        this.worker.task = task;
    }
}

function newWorker() {
    var worker = new Worker('javascripts/tool/intelligent_scissors_worker.js');
    worker.addEventListener('message', function(e) {
        var res = JSON.parse(e.data);
        var root = res["root"];
        var map = nj.array(JSON.parse(res["map"]));
        var completed = res["completed"];
        scissors.allParents[JSON.stringify(root)] = {"map": map, "completed": completed};
    });
    return worker;
}
function pointInPoints(p, points) {
    for (var i = 0; i < points.length; i++) {
        if (p[0] == points[i][0] && p[1] == points[i][1]) {
            return true;
        }
    }
    return false;
}
function computeTopography(imageData) {
    var src = cv.matFromImageData(imageData);
    var dst = new cv.Mat();
    cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);
    cv.Canny(dst, dst, 50, 100, 3, false);
    var ksize = new cv.Size(3, 3);
    cv.GaussianBlur(dst, dst, ksize, 0);
    var top = matToArray(dst);
    src.delete();
    dst.delete();

    var top = nj.divide(top, nj.max(top));
    var top = nj.multiply(top, -1);
    var top = nj.add(top, 1);
    return top;
}

window.scissors = scissors;
