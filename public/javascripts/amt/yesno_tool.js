

function loadYNTool(coco, current_num, panels=2, showGt=true) {
    for (var i = -3; i <= 3; i++) {
        var holderDiv = "#holderDiv" + i.toString();
        var ann_num = current_num + i;
        var ann = coco.dataset.annotations[ann_num];
        if (ann == null) {
            $(holderDiv).css('visibility','hidden');
            $(holderDiv + " b").css('visibility', 'hidden');
            continue;
        }

        var img = coco.imgs[ann["image_id"]];
        var cat = coco.cats[ann["category_id"]];
        drawHolderDiv(holderDiv, img, ann, panels, showGt);

        // Load style
        $(holderDiv).css('visibility', 'visible');
        if (ann["accepted"] == true) {
            $(holderDiv).toggleClass("target", true);
            $(holderDiv).toggleClass("noise", false);
        } else if (ann["accepted"] == false) {
            $(holderDiv).toggleClass("target", false);
            $(holderDiv).toggleClass("noise", true);
        } else {
            $(holderDiv).toggleClass("target", false);
            $(holderDiv).toggleClass("noise", false);
        }
    }
}

var holderDivCache = {};
function drawHolderDiv(holderDiv, img, ann, panels=2, showGt=true) {
    var cv = $(holderDiv + " canvas")[0];
    var ctx = cv.getContext('2d');

    if (showGt) {
        var iou = 0;
        if (ann.hidden_test) {
            iou = ann.hidden_test.iou;
        }
        $(holderDiv + " b").css('visibility', 'visible');
        $(holderDiv + " b").html("IoU=" + iou.toFixed(3));
    }

    var cacheKey = ann["id"] + JSON.stringify(ann["segmentation"]);
    if (cacheKey in holderDivCache) {
        // Write to holderDiv
        var imageData = holderDivCache[cacheKey];
        cv.width = imageData.width;
        cv.height = imageData.height;
        ctx.putImageData(imageData, 0, 0);
        return;
    }

    var bbox = getSquareBbox(ann);
    var segm = ann["segmentation"];
    var segmGt = showGt && ann.hidden_test ? ann.hidden_test["segmentation"] : null;
    var segmCrop = getSegmCrop(holderDiv, segm, bbox);
    var segmGtCrop = getSegmCrop(holderDiv, segmGt, bbox);

    // Draw without image
    cv.width = bbox[2] * panels;
    cv.height = bbox[3];
    ctx.clearRect(0, 0, cv.width, cv.height);

    ctx.putImageData(segmCrop, 0, 0);
    ctx.putImageData(segmGtCrop, bbox[2], 0);
    holderDivCache[cacheKey] = ctx.getImageData(0, 0, cv.width, cv.height);

    // Draw with image
    var image = new Image();
    image.crossOrigin = "Anonymous";
    image.src = getImageURL(img);
    image.onload = function () {
        cv.width = bbox[2] * panels;
        cv.height = bbox[3];
        ctx.clearRect(0, 0, cv.width, cv.height);

        ctx.globalCompositeOperation = "destination-over";
        ctx.putImageData(segmCrop, 0, 0);
        ctx.drawImage(image, bbox[0], bbox[1], bbox[2], bbox[3], 0, 0, bbox[2], bbox[3]);
        ctx.putImageData(segmGtCrop, bbox[2], 0);
        ctx.drawImage(image, bbox[0], bbox[1], bbox[2], bbox[3], bbox[2], 0, bbox[2], bbox[3]);
        holderDivCache[cacheKey] = ctx.getImageData(0, 0, cv.width, cv.height);
    };
}

function clearHolderDiv(holderDiv) {
    var cv = $(holderDiv + " canvas")[0];
    var ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, cv.width, cv.height);
}

function getSegmCrop(holderDiv, segm, bbox) {
    var cv = $(holderDiv + " canvas")[0];
    var ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, cv.width, cv.height);

    if (segm) {
        var color = [0, 0, 255, 180];
        var segmImageData = loadRLE(segm, color);
        cv.width = segmImageData.width;
        cv.height = segmImageData.height;
        ctx.putImageData(segmImageData, 0, 0);
    }
    var segmCrop = ctx.getImageData(bbox[0], bbox[1], bbox[2], bbox[3]);
    return segmCrop;
}

function getSquareBbox(ann) {
    var bbox = ann["bbox"];
    var height = ann["segmentation"]["size"][0];
    var width = ann["segmentation"]["size"][1];

    var xc = bbox[0] + bbox[2]/2;
    var yc = bbox[1] + bbox[3]/2;
    var s = Math.max(bbox[2], bbox[3]);
    if (s == 1) {
        // Broken bbox
        xc = width / 2;
        yc = height / 2;
        s = Math.max(height, width);
    } else {
        s = s * 1.25;
        var minSideLength = 0.2 * Math.min(height, width);
        s = Math.max(s, minSideLength);
    }
    // Square bbox
    var x = xc - s/2;
    var y = yc - s/2;
    var square_bbox = [x, y, s, s];
    return square_bbox;
}

function drawBbox(ctx, bbox) {
    ctx.beginPath();
    ctx.lineWidth = "2";
    ctx.strokeStyle = "red";
    ctx.rect(bbox[0], bbox[1], bbox[2], bbox[3]); 
    ctx.stroke();
}
