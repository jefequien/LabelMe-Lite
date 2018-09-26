import os
import json
import numpy as np
import logging
import sys
logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)

from dummy_datasets import *
import json_dataset_evaluator

from pycocotools.coco import COCO
from pycocotools import mask as COCOmask
from pycocotools.cocoeval import COCOeval

def categories_match():
    ade_cats = get_ade_dataset()
    coco_cats = get_coco_dataset()

    for cat in coco_cats:
        if cat in ade_cats:
            print(cat)

def study(cocoGt, cocoDt):
    print("Studying")
    coco_eval = COCOeval(cocoGt, cocoDt, iouType='segm')
    coco_eval.evaluate()
    coco_eval.accumulate()

    category_list = get_coco_dataset()
    print("log")
    json_dataset_evaluator._log_detection_eval_metrics(category_list, coco_eval)

def prep(coco):
    anns = coco.dataset["annotations"]
    filtered = [ann for ann in anns if "score" not in ann or ann["score"] > 0.5]

    print("Prepping {} -> {} annotations".format(len(anns), len(filtered)))
    for ann in filtered:
        ann["iscrowd"] = 0
        ann["area"] = COCOmask.area(ann["segmentation"])

    coco.dataset["annotations"] = filtered
    coco.createIndex()


if __name__ == "__main__":
    gt_fn = "../annotations/ade20k/ade20k_val_annotations.json"
    dt_fn = "../annotations/ade20k/ade20k_val_predictions.json"
    cocoGt = COCO(gt_fn)
    cocoDt = COCO(dt_fn)

    prep(cocoGt)
    prep(cocoDt)
    study(cocoGt, cocoDt)

    # categories_match()