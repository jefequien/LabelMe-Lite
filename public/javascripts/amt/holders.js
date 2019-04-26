


function loadMainHolders(coco, current_num, showGt=false) {

    // Load the 5 holders on the main page
    for (var i = -2; i <= 2; i++) {
        var holder = "#holderDiv" + i.toString();
        var ann = coco.dataset.annotations[current_num + i];

        // Set state as yes, no, or null
        var state = null;
        if (ann && ann.current_task && ann.current_task["type"] == "yesno") {
            state = ann.current_task["accepted"] ? "yes" : "no";
        }

        if (ann && ann.hidden_test) {
            ann.hidden_test["iou"] = computeIOU(ann["segmentation"], ann.hidden_test["segmentation"]);
        }

        loadHolder(holder, coco, ann, showGt);
        loadHolderStyle(holder, ann, showGt, state);
    }
}

function loadExampleHolders(coco, numExamples=3) {

    // Load the example holders on the instructions page
    var yesExamples = [];
    var noExamples = [];
    for (var i = 0; i < coco.dataset.annotations.length; i++) {
        var ann = coco.dataset.annotations[i];
        if (ann.hidden_test) {
            ann.hidden_test["iou"] = computeIOU(ann["segmentation"], ann.hidden_test["segmentation"]);

            if (ann.hidden_test["iou"] > 0.8) {
                yesExamples.push(ann);
            } else if (ann.hidden_test["iou"] < 0.7) {
                noExamples.push(ann);
            }
        }
        if (yesExamples.length == numExamples && noExamples.length == numExamples) {
            break;
        }
    }

    for (var i = 0; i < numExamples; i++) {
        var holder = "#exampleYes" + i.toString();
        var ann = yesExamples[i];
        loadHolder(holder, coco, ann, showGt=true);
        loadHolderStyle(holder, ann, showGt=true, state="yes");

        var holder = "#exampleNo" + i.toString();
        var ann = noExamples[i];
        loadHolder(holder, coco, ann, showGt=true);
        loadHolderStyle(holder, ann, showGt=true, state="no");
    }
}


var holderCache = {};
function loadHolder(holder, coco, ann, showGt=false, showSegm=true, showBbox=false) {
    var cv = $(holder + " canvas")[0];
    var ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (ann == null) {
        return;
    }

    // Load from cache
    var key = ann["id"] + JSON.stringify(ann["segmentation"]);
    if (key in holderCache) {
        var imageData = holderCache[key];
        cv.width = imageData.width;
        cv.height = imageData.height;
        ctx.putImageData(imageData, 0, 0);
        return;
    }

    var segm = (showSegm) ? ann["segmentation"] : null;
    var bbox = (showBbox) ? ann["bbox"] : null;
    var segmGt = (showGt && showSegm && ann.hidden_test) ? ann.hidden_test["segmentation"] : null;
    var bboxGt = (showGt && showBbox && ann.hidden_test) ? ann.hidden_test["bbox"] : null;

    // Square crop bbox
    var cropBbox = getCropBbox(ann);
    var x = cropBbox[0];
    var y = cropBbox[1];
    var w = cropBbox[2];
    var h = cropBbox[3];
    
    // Draw annotation
    var leftPanel = drawPanel(holder, segm, bbox, cropBbox);
    var rightPanel = drawPanel(holder, segmGt, bboxGt, cropBbox);
    var panelSpacing = 0.05 * w;

    cv.width = w + panelSpacing + w;
    cv.height = h;
    ctx.putImageData(leftPanel, 0, 0);
    ctx.putImageData(rightPanel, w + panelSpacing, 0);
    holderCache[key] = ctx.getImageData(0, 0, cv.width, cv.height);

    // Insert image under annotation
    var img = coco.imgs[ann["image_id"]];
    var image = new Image();
    image.crossOrigin = "Anonymous";
    image.src = getImageURL(img);
    image.onload = function () {
        ctx.globalCompositeOperation = "destination-over";
        ctx.drawImage(image, x, y, w, h, 0, 0, w, h);
        ctx.drawImage(image, x, y, w, h, w + panelSpacing, 0, w, h);
        holderCache[key] = ctx.getImageData(0, 0, cv.width, cv.height);
    };
}

function loadHolderStyle(holder, ann, showGt=false, state=null) {
    if (ann == null) {
        $(holder).css('visibility','hidden');
        $(holder + " b").css('visibility', 'hidden');
        return;
    }
    $(holder).css('visibility', 'visible');

    if (state == "yes") {
        $(holder).toggleClass("target", true);
        $(holder).toggleClass("noise", false);
    } else if (state == "no") {
        $(holder).toggleClass("target", false);
        $(holder).toggleClass("noise", true);
    } else {
        $(holder).toggleClass("target", false);
        $(holder).toggleClass("noise", false);
    }

    if (showGt) {
        var iou = ann.hidden_test ? ann.hidden_test["iou"] : 0;
        $(holder + " b").html("IoU=" + iou.toFixed(3));
        $(holder + " b").css('visibility', 'visible');
    } else {
        $(holder + " b").css('visibility', 'hidden');
    }
}

function drawPanel(holder, segm, bbox, cropBbox) {
    var cv = $(holder + " canvas")[0];
    var ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, cv.width, cv.height);

    if (segm) {
        var color = [0, 0, 255, 180];
        var segmImageData = loadRLE(segm, color);
        cv.width = segmImageData.width;
        cv.height = segmImageData.height;
        ctx.putImageData(segmImageData, 0, 0);
    }
    if (bbox) {
        ctx.beginPath();
        ctx.lineWidth = "2";
        ctx.strokeStyle = "white";
        ctx.rect(bbox[0], bbox[1], bbox[2], bbox[3]); 
        ctx.stroke();
    }

    var crop = ctx.getImageData(cropBbox[0], cropBbox[1], cropBbox[2], cropBbox[3]);

    // Highlight boundary to make more visible
    var color = [255, 255, 255, 255];
    var boundaries = findBoundariesOpenCV(crop);
    for (var i = 0; i < boundaries.length; i++) {
        var boundary = boundaries[i];
        for (var j = 0; j < boundary.length; j++) {
            var x = boundary[j][0];
            var y = boundary[j][1];
            var index = (y * crop.width + x) * 4;
            crop.data[index] = color[0];
            crop.data[index+1] = color[1];
            crop.data[index+2] = color[2];
            crop.data[index+3] = color[3];
        }
    }
    return crop;
}

function getCropBbox(ann, margin=2, maxZoom=5) {
    var h = ann["segmentation"]["size"][0];
    var w = ann["segmentation"]["size"][1];
    var min_s = Math.max(h, w) / maxZoom;
    var max_s = Math.max(h, w);

    var bbox = ann["bbox"];
    var xc = bbox[0] + bbox[2]/2;
    var yc = bbox[1] + bbox[3]/2;
    var s = Math.max(bbox[2], bbox[3]);
    if (s <= 1) {
        // Bounding box is too small
        return [0, 0, w, h];
    }

    s = s * margin
    s = Math.min(Math.max(s, min_s), max_s);
    var x = xc - s/2;
    var y = yc - s/2;
    var square_bbox = [x, y, s, s];
    return square_bbox;
}
