# Copyright (c) 2017-present, Facebook, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
##############################################################################
"""Provide stub objects that can act as stand-in "dummy" datasets for simple use
cases, like getting all classes in a dataset. This exists so that demos can be
run without requiring users to download/install datasets first.
"""

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function
from __future__ import unicode_literals

# from utils.collections import AttrDict


def get_coco_dataset():
    """A dummy COCO dataset that includes only the 'classes' field."""
    # ds = AttrDict()
    classes = [
        '__background__', 'person', 'bicycle', 'car', 'motorcycle', 'airplane',
        'bus', 'train', 'truck', 'boat', 'traffic light', 'fire hydrant',
        'stop sign', 'parking meter', 'bench', 'bird', 'cat', 'dog', 'horse',
        'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack',
        'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee', 'skis',
        'snowboard', 'sports ball', 'kite', 'baseball bat', 'baseball glove',
        'skateboard', 'surfboard', 'tennis racket', 'bottle', 'wine glass',
        'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple', 'sandwich',
        'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake',
        'chair', 'couch', 'potted plant', 'bed', 'dining table', 'toilet', 'tv',
        'laptop', 'mouse', 'remote', 'keyboard', 'cell phone', 'microwave',
        'oven', 'toaster', 'sink', 'refrigerator', 'book', 'clock', 'vase',
        'scissors', 'teddy bear', 'hair drier', 'toothbrush'
    ]
    # ds.classes = {i: name for i, name in enumerate(classes)}
    return classes


def get_ade_dataset():
    """A dummy ADE20K dataset that includes only the 'classes' field."""
    # ds = AttrDict()
    classes = [
        '__background__', 'bed', 'windowpane', 'cabinet', 'person', 'door',
        'table', 'curtain', 'chair', 'car', 'painting', 'sofa', 'shelf',
        'mirror', 'armchair', 'seat', 'fence', 'desk', 'wardrobe', 'lamp',
        'bathtub', 'railing', 'cushion', 'box', 'column', 'signboard',
        'chest of drawer', 'counter', 'sink', 'fireplace', 'refrigerator',
        'stairs', 'case', 'pool table', 'pillow', 'screen door', 'bookcase',
        'coffee table', 'toilet', 'flower', 'book', 'bench', 'countertop',
        'stove', 'palm', 'kitchen island', 'computer', 'swivel chair',
        'boat', 'arcade machine', 'bus', 'towel', 'light', 'truck',
        'chandelier', 'awning', 'streetlight', 'booth', 'television',
        'airplane', 'apparel', 'pole', 'bannister', 'ottoman',
        'bottle', 'van', 'ship', 'fountain', 'washer', 'plaything', 'stool',
        'barrel', 'basket', 'bag', 'minibike', 'oven', 'ball', 'food',
        'step', 'trade name', 'microwave', 'pot', 'animal', 'bicycle',
        'dishwasher', 'screen', 'sculpture', 'hood', 'sconce', 'vase',
        'traffic light', 'tray', 'ashcan', 'fan', 'plate', 'monitor',
        'bulletin board', 'radiator', 'glass', 'clock', 'flag'
    ]
    # ds.classes = {i: name for i, name in enumerate(classes)}
    return classes
