from PIL import Image
import numpy as np
import io

IMG_SIZE = (224, 224)  # must match training size

def preprocess_image(image):
    
    image = image.resize(IMG_SIZE)

    image = np.array(image) / 255.0  # normalize
    image = np.expand_dims(image, axis=0)

    return image

def load_image_from_bytes(image_bytes: bytes):
    return Image.open(io.BytesIO(image_bytes)).convert("RGB")