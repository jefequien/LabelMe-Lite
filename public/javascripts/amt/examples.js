

var yesThreshold = 0.8;
var noThreshold = 0.5;
var minArea = 400;

function loadExamples(coco, numExamples=10) {
    console.log("Examples", coco.dataset);
    var annotations = shuffle(coco.dataset.annotations);
    var yesExamples = getYesExamples(annotations, numExamples);
    var noExamples = getNoExamples(annotations, numExamples);
    for (var i = 0; i < numExamples; i++) {
        var ann = yesExamples[i];
        var holder = "#exampleYes" + i.toString();
        loadHolder(holder, coco, ann, showGt=false, showSegm=true, showBbox=false);
        loadHolderStyle(holder, ann, state="yes", showIou=false);
        if (i >= 1) {
            $(holder + " p").css('display', 'none');
        }

        var ann = noExamples[i];
        var holder = "#exampleNo" + i.toString();
        loadHolder(holder, coco, ann, showGt=false, showSegm=true, showBbox=false);
        loadHolderStyle(holder, ann, state="no", showIou=false);
        if (i >= 1) {
            $(holder + " p").css('display', 'none');
        }
    }
}

function getYesExamples(annotations, numExamples) {
    var yesExamples = [];
    for (var i = 0; i < annotations.length; i++) {
        var ann = annotations[i];
        if ( ! ann.hidden_test) {
            continue;
        }
        if (ann.area < minArea) {
            continue;
        }

        var iou = computeIOU(ann["segmentation"], ann.hidden_test["segmentation"]);
        if (iou > yesThreshold) {
            yesExamples.push(ann);
        }
        if (yesExamples.length == numExamples) {
            break;
        }
    }
    return yesExamples;
}

function getNoExamples(annotations, numExamples) {
    var noExamples = []
    for (var i = 0; i < annotations.length; i++) {
        var ann = annotations[i];
        if ( ! ann.hidden_test) {
            continue;
        }
        if (ann.area < minArea) {
            continue;
        }

        var iou = computeIOU(ann["segmentation"], ann.hidden_test["segmentation"]);
        if (iou < noThreshold) {
            noExamples.push(ann);
        }
        if (noExamples.length == numExamples) {
            break;
        }
    }
    return noExamples;
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}