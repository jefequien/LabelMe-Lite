
import sys
import json
import numpy as np

from pycocotools import mask as maskUtils

def read_rle():
    print(sys.argv[1])
    anns = json.loads(sys.argv[1])
    print(json.dumps(anns))
    # counts = sys.argv[1]
    # size = [int(sys.argv[2]), int(sys.argv[3])]
    # segm = {"counts": counts,
    #         "size": size}
    return anns

def read_line(line):
    split = line.split(',')
    counts = split[0]
    size0 = int(split[1])
    size1 = int(split[2])
    segm = {"counts": counts,
            "size": [size0, size1]}
    return segm


def main():
    anns = json.loads(sys.argv[1])
    for ann in anns:
        segm = ann["segmentation"]
        decoded = maskUtils.decode(segm)
        ann["segmentation"] = decoded.tolist()
    print(json.dumps(anns))


if __name__ == '__main__':
    main()