import imageio
import numpy as np

img = imageio.imread("../examples/category_mask/2.png")
print img.shape

for i in range(100):
    new_img = (img == i)
    if np.max(new_img) > 0:
        imageio.imwrite("../examples/masks/{}.png".format(i), new_img)
        print new_img.shape

