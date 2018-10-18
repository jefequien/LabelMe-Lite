
self.addEventListener('message', main, false);

function main(e) {
    self.importScripts('../../components/numjs/dist/numjs.js');
    self.importScripts('../../components/google-closure-library-compiler/compiled.js');

    var task = JSON.parse(e.data);
    var root = task["root"];
    var top = nj.array(JSON.parse(task["top"]));

    console.time("APSP");
    allPathsShortestPath(top, root);
    console.timeEnd("APSP");
}
function sendResults(root, parents, completed) {
    var res = {};
    res["root"] = root;
    res["parents"] = parents;
    res["completed"] = completed;
    res = JSON.stringify(res);
    self.postMessage(res);
}

function allPathsShortestPath(top, root) {
    distances = nj.multiply(nj.ones(top.shape), -1);
    parents = nj.zeros([top.shape[0], top.shape[1], 2], dtype='int32');

    var queue = new goog.structs.PriorityQueue();
    for (var i = 0; i < root.length; i++) {
        var r = root[i];
        distances.set(r[1], r[0], 0)
        queue.enqueue(0, r);
    }

    var c = 0;
    while (queue.getCount() > 0) {
        var p = queue.dequeue();
        var p_dist = distances.get(p[1], p[0]);
        var n_dists = getDistsToNeighbors(top, p);
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
        c += 1;
        if (c % 2000 == 0) {
            sendResults(root, parents, false);
        }
    }
    sendResults(root, parents, true);
    return parents;
}

function getDistsToNeighbors(top, p) {
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