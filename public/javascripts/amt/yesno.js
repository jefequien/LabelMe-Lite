

function loadYNTool(coco, current_num, hideAnswer, hideOri) {
    var imgs = coco.dataset.images;
    var anns = coco.dataset.annotations;
    var cats = coco.dataset.categories;

    for (var i =- 3; i <= 3; i++) {
        var holderDiv = "#holderDiv" + i.toString();
        var ann_num = current_num + i;
        if (ann_num < 0 || ann_num >= anns.length) {
            $(holderDiv).css('visibility','hidden');
            continue;
        } else {
            $(holderDiv).css('visibility', 'visible');
        }

        var ann = anns[ann_num];
        var img = coco.imgs[ann["image_id"]];
        var cat = coco.cats[ann["category_id"]];

        // Set default answer
        if (ann_num == current_num && ann["answer"] == null && ! hideAnswer) {
            ann["answer"] = false;
        }

        // Load img
        loadImage(img, ann, holderDiv, hideOri);

        // Load cat
        if (ann_num == current_num) {
            var cat = coco.cats[ann["category_id"]];
            $('#categoryDiv span').text(cat["name"]);
        }

        // Load style
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

var image_cache = {};
function loadImage(img, ann, holderDiv, hideOri) {
    var cv = $(holderDiv + " canvas")[0];
    var ctx = cv.getContext('2d');

    var id = ann["segmentation"]["counts"];
    if (id in image_cache) {
        // Write to holderDiv
        var imageData = image_cache[id];
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
    var xc = bbox[0] + bbox[2]/2;
    var yc = bbox[1] + bbox[3]/2;
    var s = Math.max(Math.max(bbox[2], bbox[3]) * 1.2, 1);
    var x = xc - s/2;
    var y = yc - s/2;

    // Load img
    var img_params = {"dataset": "places", "file_name": img.file_name}
    var img_url = getImageURL(img_params);
    var image = new Image();
    image.crossOrigin = "Anonymous";
    image.src = img_url;
    image.onload = function () {
        // Left crop
        cv.height = image.height;
        cv.width = image.width;
        ctx.drawImage(image, 0, 0);
        var imageCrop = ctx.getImageData(x, y, s, s);

        // Right crop
        ctx.globalCompositeOperation = "destination-over";
        ctx.putImageData(segmImageData, 0, 0);
        ctx.drawImage(image, 0, 0);
        var segmCrop = ctx.getImageData(x, y, s, s);

        // Merge crops
        cv.height = s;
        cv.width = 2*s;
        ctx.putImageData(imageCrop, 0, 0);
        ctx.putImageData(segmCrop, s, 0);
        var mergedCrops = ctx.getImageData(0, 0, 2*s, s);

        image_cache[id] = mergedCrops;
        if (hideOri) {
            image_cache[id] = segmCrop;
        }

        // Write to holderDiv
        var imageData = image_cache[id];
        cv.height = imageData.height;
        cv.width = imageData.width;
        ctx.putImageData(imageData, 0, 0);
    };
}