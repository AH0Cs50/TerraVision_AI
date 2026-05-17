import tensorflow as tf
import numpy as np
from pathlib import Path

MODEL_PATH = Path(__file__).resolve().parent.parent / 'models' / 'plant.keras'



def weighted_sum(inputs):
    # fallback implementation (safe version)
    # NOTE: real logic may differ depending on training
    return tf.add_n(inputs)

tf.keras.config.enable_unsafe_deserialization()

model = tf.keras.models.load_model(
    str(MODEL_PATH),
    compile=False,
    custom_objects={
        "weighted_sum": weighted_sum
    }
)

# used classes for the plant model 1.04 GB
CLASS_NAMES = [
 'Apple__black_rot',
 'Apple__healthy',
 'Apple__rust',
 'Apple__scab',
 'Cassava__bacterial_blight',
 'Cassava__brown_streak_disease',
 'Cassava__green_mottle',
 'Cassava__healthy',
 'Cassava__mosaic_disease',
 'Cherry__healthy',
 'Cherry__powdery_mildew',
 'Chili__healthy',
 'Chili__leaf curl',
 'Chili__leaf spot',
 'Chili__whitefly',
 'Chili__yellowish',
 'Coffee__cercospora_leaf_spot',
 'Coffee__healthy',
 'Coffee__red_spider_mite',
 'Coffee__rust',
 'Corn__common_rust',
 'Corn__gray_leaf_spot',
 'Corn__healthy',
 'Corn__northern_leaf_blight',
 'Cucumber__diseased',
 'Cucumber__healthy',
 'Gauva__diseased',
 'Gauva__healthy',
 'Grape__black_measles',
 'Grape__black_rot',
 'Grape__healthy',
 'Grape__leaf_blight_(isariopsis_leaf_spot)',
 'Jamun__diseased',
 'Jamun__healthy',
 'Lemon__diseased',
 'Lemon__healthy',
 'Mango__diseased',
 'Mango__healthy',
 'Peach__bacterial_spot',
 'Peach__healthy',
 'Pepper_bell__bacterial_spot',
 'Pepper_bell__healthy',
 'Pomegranate__diseased',
 'Pomegranate__healthy',
 'Potato__early_blight',
 'Potato__healthy',
 'Potato__late_blight',
 'Rice__brown_spot',
 'Rice__healthy',
 'Rice__hispa',
 'Rice__leaf_blast',
 'Rice__neck_blast',
 'Soybean__bacterial_blight',
 'Soybean__caterpillar',
 'Soybean__diabrotica_speciosa',
 'Soybean__downy_mildew',
 'Soybean__healthy',
 'Soybean__mosaic_virus',
 'Soybean__powdery_mildew',
 'Soybean__rust',
 'Soybean__southern_blight',
 'Strawberry___leaf_scorch',
 'Strawberry__healthy',
 'Sugarcane__bacterial_blight',
 'Sugarcane__healthy',
 'Sugarcane__red_rot',
 'Sugarcane__red_stripe',
 'Sugarcane__rust',
 'Tea__algal_leaf',
 'Tea__anthracnose',
 'Tea__bird_eye_spot',
 'Tea__brown_blight',
 'Tea__healthy',
 'Tea__red_leaf_spot',
 'Tomato__bacterial_spot',
 'Tomato__early_blight',
 'Tomato__healthy',
 'Tomato__late_blight',
 'Tomato__leaf_mold',
 'Tomato__mosaic_virus',
 'Tomato__septoria_leaf_spot',
 'Tomato__spider_mites_(two_spotted_spider_mite)',
 'Tomato__target_spot',
 'Tomato__yellow_leaf_curl_virus',
 'Wheat__brown_rust',
 'Wheat__healthy',
 'Wheat__septoria',
 'Wheat__yellow_rust']


def format_label(label):
    # split only once in case the label contains extra underscores
    parts = label.split("__", 1)
    plant = parts[0]
    disease = parts[1] if len(parts) > 1 else ""

    # normalize underscores to spaces and trim
    plant = plant.replace("_", " ").strip()
    disease = disease.replace("_", " ").strip()

    return {
        "plant": plant,
        "disease": disease
    }


def predict(image_array, top_k=5):
    raw = model.predict(image_array, verbose=0)

    print("Predictions shape:", raw.shape)

    # Model is a 3-member ensemble. Each branch ends with softmax.
    # weighted_sum adds them → range [0, 3]. Divide by 3 → probabilities.
    predictions = (raw[0] / 3.0).numpy()

    # determine top-k indices and build a readable list
    k = max(1, int(top_k))
    top_indices = np.argsort(predictions)[-k:][::-1]
    top_list = []
    for idx in top_indices:
        label = CLASS_NAMES[int(idx)]
        top_list.append({
            "class": format_label(label),
            "confidence": float(predictions[int(idx)])
        })

    predicted_class = int(top_indices[0])
    raw_label = CLASS_NAMES[predicted_class]

    return {
        "class": format_label(raw_label),
        "confidence": float(predictions[predicted_class]),
        "top_k": top_list
    }