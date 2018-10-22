


self.onmessage = function(event) {
    var message = JSON.parse(event.data);
    var cmd = message.cmd;

    if (cmd == "init") {
        console.log("INIT");
        initialize(message.top, message.root);
    }
    if (cmd == "run") {
        self.start = new Date();
        console.time("RUN");
        APSP(message.run_time);
    }
}

function initialize(top, root) {
    self.importScripts('../../components/numjs/dist/numjs.js');
    self.importScripts('../../components/google-closure-library-compiler/compiled.js');

    self.top = nj.array(JSON.parse(top));
    self.root = root;

    var shape = self.top.shape;
    self.distances = nj.ones(shape);
    self.distances = nj.multiply(self.distances, -1);
    self.parents = nj.ones([shape[0], shape[1], 2], dtype='int32');
    self.parents = nj.multiply(self.parents, -1);

    self.queue = new goog.structs.PriorityQueue();
    for (var i = 0; i < self.root.length; i++) {
        var r = self.root[i];
        self.distances.set(r[1], r[0], 0)
        self.queue.enqueue(0, r);
    }
}

function postResults(done) {
    var results = {};
    results["root"] = self.root;
    results["parents"] = self.parents;
    results["done"] = done;
    self.postMessage(JSON.stringify(results));
    console.timeEnd("RUN");
}

function APSP(run_time) {
    var start = new Date();
    var time = new Date();
    while (time - start < run_time) {
        if (self.queue.getCount() == 0) {
            postResults(true);
            return;
        }
        APSP_step(self.top, self.parents, self.distances, self.queue);
        time = new Date();
    }
    postResults(false);
}

function APSP_step(top, parents, distances, queue) {
    var p = queue.dequeue();
    var p_dist = distances.get(p[1], p[0]);
    var n_dists = getDistancesToNeighbors(top, p);
    for (var key in n_dists) {
        var n = JSON.parse(key);
        var n_dist = n_dists[key] + p_dist;
        var n_dist_old = distances.get(n[1], n[0]);
        if (n_dist < n_dist_old || n_dist_old == -1) {
            distances.set(n[1], n[0], n_dist);
            parents.set(n[1], n[0], 0, p[0]);
            parents.set(n[1], n[0], 1, p[1]);
            queue.enqueue(n_dist, n);
        }
    }
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
            dists[key] = top.get(y,x) * c;
        }
    }
    return dists;
}