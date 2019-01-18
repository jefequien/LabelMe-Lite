

var scissors = new Scissors();

function Scissors() {
    this.maxRuntime = 500;
    this.allParents = {};
    this.allWorkers = {};

    this.active = false;
    this.vis = false;
}
Scissors.prototype.toggle = function() {
    if (this.active) {
        this.active = false;
    } else {
        if (this.top) {
            this.active = true;
        } else {
            console.log("Could not activate scissors.");
        }
    }
}
Scissors.prototype.toggleVisualize = function() {
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
Scissors.prototype.reset = function() {
    this.allParents = {};
    for (var key in this.allWorkers) {
        this.allWorkers[key].terminate();
    }
    this.allWorkers = {};
}

//
// Pathfinding
//
Scissors.prototype.getPath = function(start, end) {
    var result = this.preprocess(start, end);
    var root = result.root;
    var point = result.point;
    this.findAPSP(root);
    
    var parents = this.allParents[JSON.stringify(root)];
    if (parents) {
        var path = this.getPathToRoot(parents, point);
        if (path) {
            // Success
            path.reverse();
            if (path.length == 1) {
                path.push(path[0]); // end was in start
            }
            return path;
        }
    }
    return null;
}
Scissors.prototype.getPathToRoot = function(parents, p) {
    var path = [p];
    while (true) {
        var x = parents.get(p[1], p[0], 0);
        var y = parents.get(p[1], p[0], 1);
        if (x == -1 && y == -1) {
            return path;
        } else if (x == -2 && y == -2) {
            return null;
        } else if (x == null || y == null) {
            console.log("BUG!")
            return;
        }
        p = [x,y];
        path.push(p);
    }
}

//
// Topography
//
Scissors.prototype.setImage = function(image_url) {
    var img = new Image();
    img.crossOrigin = "anonymous";
    img.src = image_url;
    img.onload = function() {
        var imageData = getImageData(this);
        scissors.computeTopography(imageData);
        scissors.reset();
    }
}
Scissors.prototype.computeTopography = function(imageData) {
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

    var top = nj.divide(top, nj.max(top));
    this.top = nj.add(nj.multiply(top, -1), 1);
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

//
// Workers
//
Scissors.prototype.findAPSP = function(root) {
    var key = JSON.stringify(root);
    var worker = this.allWorkers[key];
    if (worker == null) {
        worker = newWorker();
        var message = {"cmd": "init", "top": this.top, "root": root};
        worker.postMessage(JSON.stringify(message));
        this.allWorkers[key] = worker;
    }

    // Only one worker active at a time
    if ( ! (this.workerActive || worker.done)) {
        var message = {"cmd": "run", "run_time": this.maxRuntime};
        worker.postMessage(JSON.stringify(message));
        this.workerActive = true;
    }
}
function newWorker() {
    var worker = new Worker('javascripts/tool/intelligent_scissors_worker.js');
    worker.addEventListener('message', function(event) {
        var results = JSON.parse(event.data);
        var root = results["root"];
        var parents = nj.array(JSON.parse(results["parents"]));
        var done = results["done"];

        scissors.allParents[JSON.stringify(root)] = parents;
        scissors.allWorkers[JSON.stringify(root)].done = done;
        scissors.workerActive = false;
    });
    return worker;
}

window.scissors = scissors;