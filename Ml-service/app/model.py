import tensorflow as tf
import numpy as np

MODEL_PATH = "models/plant_model.h5"

model = tf.keras.models.load_model(MODEL_PATH)

# Example class labels (change to your dataset)
CLASS_NAMES = [
    "Healthy",
    "Powdery Mildew",
    "Rust",
    "Leaf Spot"
]

def predict(image_array):
    predictions = model.predict(image_array)
    predicted_class = np.argmax(predictions, axis=1)[0]

    return {
        "class": CLASS_NAMES[predicted_class],
        "confidence": float(np.max(predictions))
    }