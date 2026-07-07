from PIL import Image
import numpy as np
import io
from pathlib import Path

IMG_SIZE = (224, 224)  # must match training size

def preprocess_image(image):
    if isinstance(image, (str, Path)):
        image = Image.open(image)
    elif isinstance(image, bytes):
        image = load_image_from_bytes(image)

    image = image.convert("RGB")  # ensure 3 channels
    image = image.resize(IMG_SIZE, Image.NEAREST)  # NEAREST matches training interpolation

    image = np.array(image, dtype=np.float32) / 255.0  # normalize, match training dtype
    image = np.expand_dims(image, axis=0)

    return image

def load_image_from_bytes(image_bytes: bytes):
    try:
        return Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        raise ValueError(
            f"Failed to decode image bytes ({len(image_bytes)} bytes): {e}"
        ) from e