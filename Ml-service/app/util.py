from PIL import Image
import numpy as np

IMG_SIZE = (224, 224)  # must match training size

def preprocess_image(image_file):
    image = Image.open(image_file).convert("RGB")
    image = image.resize(IMG_SIZE)

    image = np.array(image) / 255.0  # normalize
    image = np.expand_dims(image, axis=0)

    return image