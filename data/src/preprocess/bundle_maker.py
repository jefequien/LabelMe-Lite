import os
import uuid
import json
import random
import numpy as np

from pycocotools import mask as COCOmask
from pycocotools.coco import COCO

from changeRLE import maskToRLE

BUNDLES_DIR = "../bundles"
if not os.path.isdir(BUNDLES_DIR):
    os.makedirs(BUNDLES_DIR)

def make_task(img_url, anns, coco):
    annotations = []
    for ann in anns:
        rle = ann['segmentation']
        mask = COCOmask.decode(rle)
        custom_rle = maskToRLE(mask)

        name = coco.cats[ann['category_id']]['name']
        if "score" in ann:
            name = name + " %.3f" % ann['score']

        a = {}
        a["category"] = name
        a["segmentation"] = custom_rle
        annotations.append(a)

    task = {}
    task["image_url"] = img_url
    task["annotations"] = annotations
    return task

def make_bundle(im_dir, cat, coco, bundle_size=50):
    category = coco.cats[cat]["name"]
    bundle_id = uuid.uuid4().hex
    print (category, bundle_id)

    annIds = coco.getAnnIds(catIds=[cat])
    random.shuffle(annIds)
    anns = coco.loadAnns(ids=annIds)

    bundle = []
    for ann in anns:
        if "score" in ann:
            if ann["score"] < 0.5:
                continue

        img = coco.imgs[ann["image_id"]]
        img_url = os.path.join(im_dir, img['file_name'])
        task = make_task(img_url, [ann], coco)
        bundle.append(task)

        if len(bundle) == bundle_size:
            break

    with open(os.path.join(BUNDLES_DIR, bundle_id + '.json'), 'w') as outfile:
        json.dump(bundle, outfile, indent=4)

if __name__ == "__main__":
    IMAGES_URL = "http://places.csail.mit.edu/scaleplaces/datasets/"
    im_dir = os.path.join(IMAGES_URL, "ade20k/images/")
    ann_fn = "../annotations/ade20k/ade20k_train_predictions.json"

    coco = COCO(ann_fn)
    for cat in coco.cats:
        make_bundle(im_dir, cat, coco)

