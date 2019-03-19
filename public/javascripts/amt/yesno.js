

function loadYNTool(coco, current_num, hideOri) {
    for (var i =- 3; i <= 3; i++) {
        var holderDiv = "#holderDiv" + i.toString();
        var ann_num = current_num + i;
        var ann = coco.dataset.annotations[ann_num];
        if (ann == null) {
            $(holderDiv).css('visibility','hidden');
            continue;
        }

        var img = coco.imgs[ann["image_id"]];
        var cat = coco.cats[ann["category_id"]];
        loadImageIntoHolderDiv(img, ann, holderDiv, hideOri);

        // Load style
        $(holderDiv).css('visibility', 'visible');
        if (ann["answer"] == true) {
            $(holderDiv).toggleClass("target", true);
            $(holderDiv).toggleClass("noise", false);
        } else if (ann["answer"] == false) {
            $(holderDiv).toggleClass("target", false);
            $(holderDiv).toggleClass("noise", true);
        } else {
            $(holderDiv).toggleClass("target", false);
            $(holderDiv).toggleClass("noise", false);
        }
    }
}

var cropCache = {};
function loadImageIntoHolderDiv(img, ann, holderDiv, hideOri) {
    var cv = $(holderDiv + " canvas")[0];
    var ctx = cv.getContext('2d');

    var key = JSON.stringify(ann);
    if (key in cropCache) {
        // Write to holderDiv
        var imageData = cropCache[key];
        cv.height = imageData.height;
        cv.width = imageData.width;
        ctx.putImageData(imageData, 0, 0);
        return;
    }

    // Load ann
    var segm = ann["segmentation"];
    var color = [0, 0, 255, 180];
    var segmImageData = loadRLE(segm, color);

    // Prepare square bbox
    var bbox = ann["bbox"];
    var s = Math.max(bbox[2], bbox[3]);
    var xc = bbox[0] + bbox[2]/2;
    var yc = bbox[1] + bbox[3]/2;
    if (s != 1) {
        s = s * 1.25;
        s = Math.max(s, 0.2 * Math.min(segmImageData.height, segmImageData.width));
    } else {
        s = Math.max(segmImageData.height, segmImageData.width);
        xc = segmImageData.width / 2;
        yc = segmImageData.height / 2;
    }
    var x = xc - s/2;
    var y = yc - s/2;

    // Load img
    var img_url = getImageURL(img);
    var image = new Image();
    image.crossOrigin = "Anonymous";
    image.src = img_url;
    image.onload = function () {
        cv.height = segmImageData.height;
        cv.width = segmImageData.width;

        // Left crop
        ctx.drawImage(image, 0, 0, cv.width, cv.height);
        var imageCrop = ctx.getImageData(x, y, s, s);

        // Right crop
        ctx.globalCompositeOperation = "destination-over";
        ctx.putImageData(segmImageData, 0, 0);
        ctx.drawImage(image, 0, 0, cv.width, cv.height);
        var segmCrop = ctx.getImageData(x, y, s, s);

        // Merge crops
        cv.height = s;
        cv.width = 2*s;
        ctx.putImageData(imageCrop, 0, 0);
        ctx.putImageData(segmCrop, s, 0);
        var mergedCrops = ctx.getImageData(0, 0, 2*s, s);

        // Cache crop
        cropCache[key] = mergedCrops;
        if (hideOri) {
            cropCache[key] = segmCrop;
        }

        // Write to holderDiv
        var imageData = cropCache[key];
        cv.height = imageData.height;
        cv.width = imageData.width;
        ctx.putImageData(imageData, 0, 0);
    };
}