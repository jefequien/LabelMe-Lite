import json

task0 = {}
task0["task_id"] = "00000000"
task0["image_url"] = "http://localhost:3000/examples?filename=images/2.jpg"
ann0 = {}
ann0["category"] = "person"
ann0["mask_url"] = "http://localhost:3000/examples?filename=masks/13.png"
ann1 = {}
ann1["category"] = "wall"
ann1["mask_url"] = "http://localhost:3000/examples?filename=masks/1.png"
task0["annotations"] = [ann0, ann1]

task1 = {}
task1["task_id"] = "00000001"
task1["image_url"] = "http://localhost:3000/examples?filename=images/1.jpg"
task1["segmentation_url"] = "http://localhost:3000/examples?filename=masks/13.png"

task2 = {}
task2["task_id"] = "00000002"
task2["image_url"] = "https://www.agardenforthehouse.com/wp-content/uploads/2018/04/gardendesign4englishroseum.jpg"
task2["segmentation_url"] = ""

tasks = [task0, task1, task2]

with open('tasks.json', 'w') as outfile:
    json.dump(tasks, outfile, indent=4)