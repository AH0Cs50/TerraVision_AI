import tensorflow as tf
import numpy as np
from pathlib import Path
import re

MODEL_PATH = Path(__file__).resolve().parent.parent / 'models' / 'plant.keras'



ENSEMBLE_WEIGHTS = [0.2, 0.3, 0.5]  # EfficientNet, ResNet, MobileNet — matches training
TEMPERATURE = 2.0  # Softmax temperature scaling for calibrated confidence values

def weighted_sum(inputs):
    return tf.add_n([w * t for w, t in zip(ENSEMBLE_WEIGHTS, inputs)])

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


# Keywords that can appear in disease names — used to infer disease type from the class label
_FUNGAL_KW = ["rust", "mildew", "blight", "rot", "spot", "scab", "mold", "anthracnose",
              "septoria", "measles", "scorch", "smut", "blast", "cercospora", "isariopsis", "algal"]
_BACTERIAL_KW = ["bacterial"]
_VIRAL_KW = ["virus", "mosaic", "streak"]
_PEST_KW = ["whitefly", "mite", "caterpillar", "hispa", "diabrotica"]
_PHYSIO_KW = ["curl", "yellowish", "mottle"]

def classify_disease_type(disease_name):
    name = disease_name.lower().strip()
    if name == "healthy":
        return "healthy"
    if any(kw in name for kw in _BACTERIAL_KW):
        return "bacterial"
    if any(kw in name for kw in _VIRAL_KW):
        return "viral"
    if any(kw in name for kw in _PEST_KW):
        return "pest"
    if any(kw in name for kw in _FUNGAL_KW):
        return "fungal"
    if any(kw in name for kw in _PHYSIO_KW):
        return "physiological"
    if name == "diseased":
        return "unknown"
    return "unknown"

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
        "disease": disease,
        "disease_type": classify_disease_type(disease)
    }


def _normalize_plant_name(value):
    if not value:
        return ""

    value = value.lower()
    value = re.sub(r"[^a-z0-9]+", " ", value)
    value = re.sub(r"\b(plant|crop|tree|flower)\b", " ", value)
    value = " ".join(value.split())
    value = value.replace("gauva", "guava")
    return value


def _plant_matches(label, expected_plant):
    if not expected_plant:
        return False

    label_plant = _normalize_plant_name(format_label(label)["plant"])
    expected = _normalize_plant_name(expected_plant)
    label_tokens = set(label_plant.split())
    expected_tokens = set(expected.split())

    return bool(
        label_plant
        and expected
        and (
            label_plant == expected
            or label_plant in expected
            or expected in label_plant
            or label_tokens == expected_tokens
            or label_tokens.issubset(expected_tokens)
        )
    )


def _format_ranked_predictions(predictions, indices, top_k):
    k = max(1, int(top_k))
    ranked_indices = sorted(indices, key=lambda idx: predictions[int(idx)], reverse=True)[:k]

    return [
        {
            "class": format_label(CLASS_NAMES[int(idx)]),
            "confidence": round(float(predictions[int(idx)]), 4)
        }
        for idx in ranked_indices
    ]


def predict(image_array, top_k=5, expected_plant=None):
    raw = model.predict(image_array, verbose=0)

    # Each branch ends with softmax, weighted_sum produces weighted avg → range [0, 1]
    predictions = np.asarray(raw[0])

    if np.any(np.isnan(predictions)):
        result = {
            "class": {"plant": "Unknown", "disease": "healthy", "disease_type": "healthy"},
            "confidence": 1.0,
            "confidence_delta": 0.0,
            "entropy": 0.0,
            "top_k": [
                {"class": {"plant": "Unknown", "disease": "healthy", "disease_type": "healthy"}, "confidence": 1.0}
            ]
        }
        if expected_plant:
            result["expected_plant"] = expected_plant
        return result

    predictions = np.clip(predictions, 1e-10, 1)

    # Temperature scaling: soften overconfident softmax probabilities
    logits = np.log(predictions)
    scaled = np.exp(logits / TEMPERATURE)
    predictions = scaled / np.sum(scaled)

    all_indices = list(range(len(CLASS_NAMES)))
    global_top_list = _format_ranked_predictions(predictions, all_indices, top_k)

    matching_indices = [
        idx for idx, label in enumerate(CLASS_NAMES)
        if _plant_matches(label, expected_plant)
    ]

    ranked_indices = matching_indices or all_indices
    top_list = _format_ranked_predictions(predictions, ranked_indices, top_k)
    predicted_class = next(
        idx for idx in ranked_indices
        if format_label(CLASS_NAMES[int(idx)]) == top_list[0]["class"]
    )
    raw_label = CLASS_NAMES[predicted_class]

    # Uncertainty metrics
    sorted_preds = np.sort(predictions)[::-1]
    confidence_delta = round(float(sorted_preds[0] - sorted_preds[1]), 4)
    eps = 1e-10
    entropy = round(float(-np.sum(predictions * np.log(predictions + eps))), 4)

    result = {
        "class": format_label(raw_label),
        "confidence": round(float(predictions[predicted_class]), 4),
        "confidence_delta": confidence_delta,
        "entropy": entropy,
        "top_k": top_list
    }

    if expected_plant:
        result["expected_plant"] = expected_plant
        if matching_indices:
            result["scope"] = "plant_constrained"
            result["global_prediction"] = global_top_list[0]
            result["global_top_k"] = global_top_list
        else:
            result["scope"] = "global"
            result["plant_filter_warning"] = (
                f"No supported model class matched expected plant '{expected_plant}'."
            )

    return result
