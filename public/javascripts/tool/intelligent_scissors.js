

var scissors = new Scissors();

function Scissors() {
    this.active = true;

    this.allParents = {};
    this.worker = newWorker();
}

Scissors.prototype.setImageData = function(imageData) {
    this.top = getTopography(imageData);
    // this.visualize();

    this.allParents = {};
    this.worker.terminate();
}

Scissors.prototype.visualize = function() {
    var vis = nj.multiply(this.top, 255/nj.max(this.top));
    var imageData = arrayToImageData(vis);
    background.setImageData(imageData);
}

Scissors.prototype.getPath = function(start, end) {
    var root = start;
    if ( ! Array.isArray(root[0])) {
        root = [root];
    }

    var key = JSON.stringify(root);
    if (key in this.allParents) {
        var parents = this.allParents[key]["parents"];
        var completed = this.allParents[key]["completed"];
        if ( ! completed) {
            this.sendTaskToWorker(root);
        }

        var path = this.getPathToRoot(parents, end);
        if (path != null) {
            path.reverse();
            return path;
        } else {
            return null;
        }
    } else {
        this.sendTaskToWorker(root);
        return null;
    }
}

Scissors.prototype.getPathToRoot = function(parents, p) {
    var x = Math.max(0, Math.min(p[0], this.top.shape[1]-1));
    var y = Math.max(0, Math.min(p[1], this.top.shape[0]-1));
    var p = [x,y];
    var path = [p];
    while (true) {
        var x = parents.get(p[1], p[0], 0);
        var y = parents.get(p[1], p[0], 1);
        if (x == 0 && y == 0) {
            break;
        }
        p = [x,y];
        path.push(p);

        // Prevents loop
        if (x == null || y == null) {
            console.log("BUG!")
            break;
        }
    }
    if (path.length == 1) {
        return null;
    }
    return path;
}

Scissors.prototype.addParents = function(root, parents, completed) {
    var key = JSON.stringify(root);
    this.allParents[key] = {"parents": parents, "completed": completed};
}

Scissors.prototype.sendTaskToWorker = function(root) {
    // Send task to worker
    var task = {};
    task["root"] = root;
    task["top"] = this.top;
    var task = JSON.stringify(task);
    if (this.worker.task != task) {
        this.worker.terminate();
        this.worker = newWorker();
        this.worker.postMessage(task);
        this.worker.task = task;
    }
}

function newWorker() {
    var worker = new Worker('javascripts/tool/intelligent_scissors_worker.js');
    worker.addEventListener('message', receiveDataFromWorker);
    return worker;
}
function receiveDataFromWorker(e) {
    var res = JSON.parse(e.data);
    var root = res["root"];
    var parents = nj.array(JSON.parse(res["parents"]));
    var completed = res["completed"];

    scissors.addParents(root, parents, completed);
}

function getTopography(imageData) {
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
