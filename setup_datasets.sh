ln -s /data/vision/oliva/scenedataset/scaleplaces/datasets/ade20k/ data/
ln -s /data/vision/oliva/scenedataset/scaleplaces/datasets/coco/ data/

python data/src/preprocess/changeRLE.py -i data/ade20k/annotations/annotations_instance/ade20k_val_annotations.json -o data/annotations/ade20k_val_annotations_#.json