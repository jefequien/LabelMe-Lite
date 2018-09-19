import imageio
import numpy as np
import cv2

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

category_mask = imageio.imread("../../examples/category_mask/2.png")
category_mask = remove_noise(category_mask)

for i in np.unique(category_mask):
    cat_mask = (category_mask == i)
    imageio.imwrite("../../examples/masks/{}.png".format(i), cat_mask)
    print cat_mask.shape

