import os
import json
import numpy as np

from pycocotools.coco import COCO

def maskToRLE(mask):
    h, w = mask.shape
    flattened = mask.flatten()

    padded = np.hstack([[0], flattened, [0]])
    difs = np.diff(padded)
    starts = np.where(difs == 1)[0]
    ends = np.where(difs == -1)[0]

    zipped = np.array(zip(starts, ends)).flatten()
    padded = np.hstack([[0], zipped, flattened.shape[0]])
    counts = np.diff(padded)
    if counts[-1] == 0:
        counts = counts[:-1]

    counts = [str(c) for c in counts]
    counts = "#".join(counts)

    rle = {}
    rle["height"] = mask.shape[0]
    rle["width"] = mask.shape[1]
    rle["counts"] = counts
    return rle


if __name__ == "__main__":
    ann_fn = "../annotations/ade20k/ade20k_val_predictions.json"
    coco = COCO(ann_fn)
    c = 0
    for annId in coco.anns:
        c += 1
        print("{}/{}".format(c, len(coco.anns)))
        ann = coco.anns[annId]
        mask = coco.annToMask(ann)
        ann["segmentation"] = maskToRLE(mask)

    output = {}
    output["images"] = list(coco.imgs.values())
    output["annotations"] = list(coco.anns.values())
    output["categories"] = list(coco.cats.values())
    with open('../annotations/ade20k/ade20k_val_predictions_#.json', 'w') as outfile:
        json.dump(output, outfile, indent=2)
