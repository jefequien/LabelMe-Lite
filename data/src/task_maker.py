import os
import json
import numpy as np

from pycocotools import mask as COCOmask
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

    rle = {}
    rle["height"] = mask.shape[0]
    rle["width"] = mask.shape[1]
    rle["counts"] = counts.tolist()
    return rle

def make_task(img_url, anns, coco):
    annotations = []
    for ann in anns:
        rle = ann['segmentation']
        mask = COCOmask.decode(rle)
        custom_rle = maskToRLE(mask)

        a = {}
        a["category"] = coco.cats[ann['category_id']]['name']
        a["segmentation"] = custom_rle
        annotations.append(a)

    task = {}
    task["image_url"] = img_url
    task["annotations"] = annotations
    return task


if __name__ == "__main__":
    IMAGES_URL = "http://places.csail.mit.edu/scaleplaces/datasets/"
    im_dir = os.path.join(IMAGES_URL, "ade20k/images/training")
    ann_fn = "ade20k_train_annotations.json"
    coco = COCO(ann_fn)

    tasks = []
    for i in range(10):
        img = coco.imgs[i]
        annIds = coco.getAnnIds(imgIds=[img['id']])
        anns = coco.loadAnns(ids=annIds)
        img_url = os.path.join(im_dir, img['file_name'])
        
        task = make_task(img_url, anns, coco)
        task['task_id'] = i

        tasks.append(task)
        
    with open('../tasks/tasks.json', 'w') as outfile:
        json.dump(tasks, outfile, indent=4)