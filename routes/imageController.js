var express = require('express');
var path = require('path');
var fs = require('fs');
var router = express.Router();

var json = fs.readFileSync(path.join(__dirname, "../data_config.json"));
var data_config = JSON.parse(json);

/* Get Image */
router.get('/', function(req, res) {
    folder_name = req.query.folder;
    file_name = req.query.image;

    root_path = data_config[folder_name]["images"];
    file_path = path.join(root_path, file_name);

    if (! path.isAbsolute(file_path)) {
        file_path = path.join(__dirname, file_path)
    }
    console.log(file_path);
    res.sendFile(file_path);
});

/* Get next image */
router.get('/next', function(req, res) {
    project = req.query.folder;
    image_name = req.query.image;

    root_path = data_config[project]["images"];
    image_path = path.join(root_path, image_name);

    file_name = path.basename(image_path);
    dir = path.dirname(image_path)

    var list = listImages(dir);
    var index = list.indexOf(file_name);
    var next_index = Math.min(index+1, list.length-1);
    var next_name = list[next_index];

    var next_image_name = image_name.replace(file_name, next_name);
    res.send(next_image_name);
});

/* Get previous image */
router.get('/previous', function(req, res) {
    project = req.query.folder;
    image_name = req.query.image;

    root_path = data_config[project]["images"];
    image_path = path.join(root_path, image_name);

    file_name = path.basename(image_path);
    dir = path.dirname(image_path)

    var list = listImages(dir);
    var index = list.indexOf(file_name);
    var prev_index = index-1;
    if (prev_index == -1) {
        prev_index = list.length - 1;
    }
    var prev_name = list[prev_index];
    var prev_image_name = image_name.replace(file_name, prev_name);
    res.send(prev_image_name);
});

function listImages(folder_path) {
    if (! path.isAbsolute(folder_path)) {
        folder_path = path.join(__dirname, folder_path)
    }
    var items = fs.readdirSync(folder_path);
    var images = [];
    for (var i in items) {
        if (items[i][0] != '.'){
            images.push(items[i]);
        }
    }
    return images;
}

module.exports = router;
