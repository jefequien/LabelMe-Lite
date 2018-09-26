import os
import json
import numpy as np
import cv2

from dummy_datasets import *

from pycocotools.coco import COCO
from pycocotools import mask as COCOmask

def remove_noise(category_mask):
    kernel = np.ones((3,3),np.uint8) # Use odd kernel size

    background = (category_mask == 0)
    background = np.array(background, dtype=np.uint8)
    opened = cv2.morphologyEx(background, cv2.MORPH_OPEN, kernel)
    noise = (background != opened)

    # Claim in category order
    for i in np.unique(category_mask):
        if i == 0:
            continue
        cat_mask = np.array(category_mask == i, dtype=np.uint8)
        cat_mask = cv2.dilate(cat_mask, kernel)
        claimed = np.logical_and(cat_mask, noise)
        category_mask[claimed] = i
    return category_mask

def ann_image_to_annotations(ann_image):
    if np.ndim(ann_image) == 3:
        ann_image = ann_image[:,:,2]
    anns = []
    for cat in np.unique(ann_image):
        if cat == 0:
            continue
        mask = (ann_image == cat)
        mask = np.asfortranarray(mask)
        mask = mask.astype(np.uint8)
        segm = COCOmask.encode(mask)
        segm["counts"] = segm["counts"].decode('ascii')

        ann = {}
        ann["segmentation"] = segm
        ann["category_id"] = int(cat)
        anns.append(ann)
    return anns

def make_ann_fn(im_dir, ann_dir, im_list, cat_list):
    images = []
    annotations = []
    categories = []
    annId = 0
    for imgId,im in enumerate(im_list):
        im_path = os.path.join(im_dir, im)
        image = cv2.imread(im_path)
        img = {}
        img["file_name"] = im
        img["id"] = imgId
        img["height"] = image.shape[0]
        img["width"] = image.shape[1]
        images.append(img)
        print(img["id"], img["file_name"])

        ann_path = os.path.join(ann_dir, im).replace('.jpg', '.png')
        ann_image = cv2.imread(ann_path)
        anns = ann_image_to_annotations(ann_image)
        for ann in anns:
            ann["image_id"] = imgId
            ann["id"] = annId
            annotations.append(ann)
            annId += 1

    for i, name in enumerate(cat_list):
        categories.append({"id": i, "name": name})

    ann_fn = {}
    ann_fn["images"] = images
    ann_fn["annotations"] = annotations
    ann_fn["categories"] = categories
    return ann_fn


if __name__ == "__main__":
    DATASET_DIR = "/data/vision/oliva/scenedataset/scaleplaces/datasets/"
    im_dir = os.path.join(DATASET_DIR, "ade20k/images/")
    ann_dir = os.path.join(DATASET_DIR, "ade20k/annotations/annotations_instance/")
    im_list = os.path.join(DATASET_DIR, "ade20k/images/training.txt")
    cat_list = get_ade_dataset()
    
    with open(im_list,'r') as f:
        im_list = f.read().splitlines()
    
    ann_fn = make_ann_fn(im_dir, ann_dir, im_list, cat_list)
    with open('output.json', 'w') as outfile:
            json.dump(ann_fn, outfile, indent=2)

