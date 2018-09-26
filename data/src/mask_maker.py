import imageio
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
    anns = []
    for cat in np.unique(ann_image):
        mask = (ann_image == cat)
        segmentation = COCOmask.encode(mask)

        ann = {}
        ann["segmentation"] = segmentation
        ann["category_id"] = cat
        anns.append(ann)
    return anns

def make_ann_fn(im_dir, ann_dir, im_list, cat_list):
    images = []
    annotations = []
    categories = []
    annId = 0
    for imgId,im in enumerate(im_list):
        image = cv2.imread(os.path.join(im_dir, im))
        img = {}
        img["file_name"] = im
        img["id"] = imgId
        img["height"] = image.shape[0]
        img["width"] = image.shape[1]
        images.append(img)

        ann_path = os.path.join(ann_dir, im)
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
    im_dir = os.path.join(DATASET_DIR, "ade20k/images/training")
    ann_dir = os.path.join(DATASET_DIR, "ade20k/annotations/annotations_instance/training")
    im_list = os.path.join(DATASET_DIR, "ade20k/images/training.txt")
    cat_list = get_ade_classes()
    
    with open(im_list,'r') as f:
        im_list = f.readLines()

    make_ann_fn(im_dir, ann_dir, im_list, cat_list)


