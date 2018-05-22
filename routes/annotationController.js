var express = require('express');
var path = require('path');
var fs = require('fs');
var router = express.Router();

var json = fs.readFileSync(path.join(__dirname, "../data_config.json"));
var data_config = JSON.parse(json);


/* Get polygon. */
router.get('/polygons', function(req, res) {
    folder_name = req.query.folder;
    file_name = req.query.image.split(".")[0] + "-polygons.json";

    root_path = data_config[folder_name]["polygons"]
    file_path = path.join(root_path, file_name)

    if (! path.isAbsolute(file_path)) {
        file_path = path.join(__dirname, file_path)
    }
    try {
        var data = fs.readFileSync(file_path);
        json = JSON.parse(data);
        res.json(json);
    } catch (err) {
        res.status(404).send('Not found');
    }
});

/* Get mask */
/* You never need to get a mask */

/* Post polygon */
router.post('/polygons', function (req, res) {
    folder_name = req.query.folder;
    file_name = req.query.image.split(".")[0] + "-polygons.json";

    root_path = data_config[folder_name]["polygons"]
    file_path = path.join(root_path, file_name)

    if (! path.isAbsolute(file_path)) {
        file_path = path.join(__dirname, file_path)
    }

    data = JSON.stringify(req.body, null, 2);
    data = condense(data);
    fs.writeFile(file_path, data, function(err) {
        if(err) {
            res.send('Error saving file.');
            return console.log(err);
        }
        console.log("The polygon file was saved!");
        res.send('Saved polygons to server.');
    }); 
})

function condense(string) {
    var new_string = "";
    var split = string.split("\n")
    for (var i=0; i < split.length; i++){
        var line = split[i];
        if (line.includes("{") || line.includes("}") || line.includes(":")) {
            new_string += "\n" + line;
        } else {
            new_string += line.trim();
        }
    }
    return new_string;
}

module.exports = router;
