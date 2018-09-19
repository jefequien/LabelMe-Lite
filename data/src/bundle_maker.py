import os
import uuid
import json
import random
import numpy as np

from pycocotools import mask as COCOmask
from pycocotools.coco import COCO

IMAGES_URL = "http://places.csail.mit.edu/scaleplaces/datasets/"

# Hack!!! Exposes mask through examples api
def hack(mask):
    import imageio

    examples_dir = "../../examples/temp/"
    examples_url = "http://localhost:3000/examples?filename=temp/"
    if not os.path.isdir(examples_dir):
        os.makedirs(examples_dir)

    filename = uuid.uuid4().hex + ".png"
    mask *= 255
    imageio.imwrite(os.path.join(examples_dir, filename), mask)
    return examples_url + filename

def make_bundle(coco, category, annIds):
    bundle_id = uuid.uuid4().hex
    print category, bundle_id

    bundle = []
    for annId in annIds:
        ann = coco.loadAnns([annId])[0]
        imgId = ann["image_id"]
        img = coco.loadImgs([imgId])[0]
        mask = coco.annToMask(ann)

        task = {}
        task["category"] = category
        task["image_url"] = os.path.join(im_dir, img["file_name"])
        task["annotations"] = []
        task["annotations"].append({"category": category, "segmentation": hack(mask)})
        bundle.append(task)

    with open('../bundles/{}.json'.format(bundle_id), 'w') as outfile:
        json.dump(bundle, outfile, indent=4)

im_dir = ""
ann_fn = ""
project = "ade20k_val"
bundle_size = 50

if project == "ade20k_train":
    im_dir = os.path.join(IMAGES_URL, "ade20k/images/training")
    ann_fn = "ade20k_train_annotations.json"
elif project == "ade20k_val":
    im_dir = os.path.join(IMAGES_URL, "ade20k/images/validation")
    ann_fn = "ade20k_val_annotations.json"


coco = COCO(ann_fn)
for cat in coco.cats:
    category = coco.loadCats(cat)[0]["name"]
    annIds = coco.getAnnIds(catIds=[cat])
    random.shuffle(annIds)
    while len(annIds) > 0:
        make_bundle(coco, category, annIds[:bundle_size])
        annIds = annIds[bundle_size:]
        break

