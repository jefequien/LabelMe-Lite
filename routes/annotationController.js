var express = require('express');
var path = require('path');
var fs = require('fs');
var PythonShell = require('python-shell');
var router = express.Router();

var json = fs.readFileSync(path.join(__dirname, "../data_config.json"));
var data_config = JSON.parse(json);


/* Get mask. */
router.get('/masks', function(req, res) {
    project_name = req.query.project;
    image_id = 63
    file_path = "../ade20k_train_0.1_A.json"
    if (! path.isAbsolute(file_path)) {
        file_path = path.join(__dirname, file_path)
    }

    try {
        var data = fs.readFileSync(file_path);
        json = JSON.parse(data);

        var imgs = json['images'];
        var anns = json['annotations'];
        var cats = json['categories'];

        var img_anns = [];
        for (var i = 0; i < anns.length; i++){
            ann = anns[i];
            if (ann['image_id'] == image_id){
                var segm = ann["segmentation"];
                img_anns.push(ann);
            }
        }

        // // Send to Python to decode!
        var options = {
          mode: 'text',
          args: [JSON.stringify(img_anns)]
        };

        PythonShell.run('routes/annotation.py', options, function (err, results) {
            if (err) throw err;
            // results is an array consisting of messages collected during execution
            result = JSON.parse(results[0]);

            done = {};
            done["objects"] = result;
            res.json(done);
        });

    } catch (err) {
        console.log(err)
        res.status(404).send('Not found');
    }
});

// function rleDecode(segm) {
//     console.log(segm);
//     var str = segm["counts"];
//     var cnts = new Array;
//     // var v = 0;
//     var p = 0;
//     var m = 0;
//     while( str[p] ) {
//         console.log("#######");
//         x=0; k=0; more=1;
//         while( more ) {
//           var c = str.charCodeAt(p) - 48;
//           console.log(c);
//           x |= (c & 0x1f) << 5*k;
//           more = c & 0x20;
//           p++;
//           k++;
//           if (!more && (c & 0x10)) {
//             x |= -1 << 5*k;
//           }
//         }
//         if(m>2) {
//             x += cnts[m-2];
//             cnts[m++] = x;
//         }
//     }
//     console.log(cnts);
//     console.log(segm);
//     return segm;
// }


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
