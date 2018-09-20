var express = require('express');
var path = require('path');
var fs = require('fs');
var router = express.Router();

var tasks = read_tasks();

/* Get task. */
router.get('/tasks', function(req, res) {
    var task_id = req.query.id;
    var task = tasks[task_id];
    if (task) {
        res.json(task);
    } else {
        res.status(404).send('Not found');
    }
});

router.get('/bundles', function(req, res) {
    var bundle_id = req.query.id;

    var bundles_dir = path.join(__dirname, "../data/bundles");
    var file_path = path.join(bundles_dir, bundle_id + ".json");
    res.sendFile(file_path);
});


function read_tasks() {
    var filename = path.join(__dirname, "../data/tasks/tasks.json")
    var json = fs.readFileSync(filename);
    var json = JSON.parse(json);

    var tasks = {};
    for (var i = 0; i < json.length; i++){
        tasks[json[i]["task_id"]] = json[i];
    }
    return tasks;
}

module.exports = router;
