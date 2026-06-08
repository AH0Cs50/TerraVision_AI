# Plant Disease Detection API

## Overview

A FastAPI microservice that classifies plant diseases from leaf images using a CNN ensemble model (TensorFlow/Keras).

- **Model:** 3-member ensemble CNN (`plant.keras`, ~1.04 GB)
- **Input size:** 224×224 RGB pixels
- **Output:** 88 plant-disease classes

---

## Endpoint

### `POST /predict`

Plant-specific detection. Filters predictions to only the user's plant type.

#### Request Body

```json
{
  "user_id": "u123",
  "plant_id": "p456",
  "key": "plants/user_uuid/plant_uuid/images/leaf.png",
  "expected_plant": "Tomato"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | string | Unique identifier for the user |
| `plant_id` | string | Unique identifier for the plant |
| `key` | string | S3 object key pointing to the uploaded image |
| `expected_plant` | string | (optional) Plant name for narrowing top predictions |

### `POST /predict/general`

No-user detection. No plant filtering — returns top global predictions across all 88 classes.

#### Request Body

```json
{
  "key": "general/images/12345-leaf.png"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `key` | string | S3 object key pointing to the uploaded image |

The image is fetched from S3 (Storj) using the provided `key`, decoded, resized to 224×224 via **NEAREST-neighbor interpolation** (matching training pipeline), normalized to [0, 1] as float32, and passed to the model.

#### Success Response

```json
{
  "success": true,
  "user_id": "u123",
  "plant_id": "p456",
  "image_key": "plant/user_u123_plant_p456/images/leaf.png",
  "prediction": {
    "class": {
      "plant": "Potato",
      "disease": "early blight",
      "disease_type": "fungal"
    },
    "confidence": 0.92,
    "top_k": [
      { "class": { "plant": "Potato", "disease": "early blight", "disease_type": "fungal" }, "confidence": 0.92 },
      { "class": { "plant": "Potato", "disease": "late blight", "disease_type": "fungal" }, "confidence": 0.04 },
      { "class": { "plant": "Potato", "disease": "healthy", "disease_type": "healthy" }, "confidence": 0.02 }
    ]
  },
  "model": {
    "name": "plant-disease-cnn",
    "version": "1.0.0",
    "input_size": [224, 224]
  },
  "processing": {
    "inference_time_ms": 143,
    "timestamp": "2026-05-18T12:00:00Z"
  }
}
```

#### Error Response

```json
{
  "success": false,
  "error": "<exception message>"
}
```

---

## Image Preprocessing

1. Convert to RGB (3 channels)
2. Resize to 224×224 pixels using **NEAREST-neighbor interpolation** (must match training pipeline)
3. Convert to `float32` and normalize pixel values to `[0, 1]` (divide by 255.0)
4. Add batch dimension → shape `(1, 224, 224, 3)`

---

## Supported Classes (88)

### Apple
| Class | Disease |
|-------|---------|
| Apple__black_rot | Black rot |
| Apple__healthy | Healthy |
| Apple__rust | Rust |
| Apple__scab | Scab |

### Cassava
| Class | Disease |
|-------|---------|
| Cassava__bacterial_blight | Bacterial blight |
| Cassava__brown_streak_disease | Brown streak disease |
| Cassava__green_mottle | Green mottle |
| Cassava__healthy | Healthy |
| Cassava__mosaic_disease | Mosaic disease |

### Cherry
| Class | Disease |
|-------|---------|
| Cherry__healthy | Healthy |
| Cherry__powdery_mildew | Powdery mildew |

### Chili
| Class | Disease |
|-------|---------|
| Chili__healthy | Healthy |
| Chili__leaf curl | Leaf curl |
| Chili__leaf spot | Leaf spot |
| Chili__whitefly | Whitefly |
| Chili__yellowish | Yellowish |

### Coffee
| Class | Disease |
|-------|---------|
| Coffee__cercospora_leaf_spot | Cercospora leaf spot |
| Coffee__healthy | Healthy |
| Coffee__red_spider_mite | Red spider mite |
| Coffee__rust | Rust |

### Corn (Maize)
| Class | Disease |
|-------|---------|
| Corn__common_rust | Common rust |
| Corn__gray_leaf_spot | Gray leaf spot |
| Corn__healthy | Healthy |
| Corn__northern_leaf_blight | Northern leaf blight |

### Cucumber
| Class | Disease |
|-------|---------|
| Cucumber__diseased | Diseased |
| Cucumber__healthy | Healthy |

### Guava
| Class | Disease |
|-------|---------|
| Gauva__diseased | Diseased |
| Gauva__healthy | Healthy |

### Grape
| Class | Disease |
|-------|---------|
| Grape__black_measles | Black measles |
| Grape__black_rot | Black rot |
| Grape__healthy | Healthy |
| Grape__leaf_blight_(isariopsis_leaf_spot) | Leaf blight (Isariopsis leaf spot) |

### Jamun
| Class | Disease |
|-------|---------|
| Jamun__diseased | Diseased |
| Jamun__healthy | Healthy |

### Lemon
| Class | Disease |
|-------|---------|
| Lemon__diseased | Diseased |
| Lemon__healthy | Healthy |

### Mango
| Class | Disease |
|-------|---------|
| Mango__diseased | Diseased |
| Mango__healthy | Healthy |

### Peach
| Class | Disease |
|-------|---------|
| Peach__bacterial_spot | Bacterial spot |
| Peach__healthy | Healthy |

### Pepper Bell
| Class | Disease |
|-------|---------|
| Pepper_bell__bacterial_spot | Bacterial spot |
| Pepper_bell__healthy | Healthy |

### Pomegranate
| Class | Disease |
|-------|---------|
| Pomegranate__diseased | Diseased |
| Pomegranate__healthy | Healthy |

### Potato
| Class | Disease |
|-------|---------|
| Potato__early_blight | Early blight |
| Potato__healthy | Healthy |
| Potato__late_blight | Late blight |

### Rice
| Class | Disease |
|-------|---------|
| Rice__brown_spot | Brown spot |
| Rice__healthy | Healthy |
| Rice__hispa | Hispa |
| Rice__leaf_blast | Leaf blast |
| Rice__neck_blast | Neck blast |

### Soybean
| Class | Disease |
|-------|---------|
| Soybean__bacterial_blight | Bacterial blight |
| Soybean__caterpillar | Caterpillar |
| Soybean__diabrotica_speciosa | Diabrotica speciosa |
| Soybean__downy_mildew | Downy mildew |
| Soybean__healthy | Healthy |
| Soybean__mosaic_virus | Mosaic virus |
| Soybean__powdery_mildew | Powdery mildew |
| Soybean__rust | Rust |
| Soybean__southern_blight | Southern blight |

### Strawberry
| Class | Disease |
|-------|---------|
| Strawberry___leaf_scorch | Leaf scorch |
| Strawberry__healthy | Healthy |

### Sugarcane
| Class | Disease |
|-------|---------|
| Sugarcane__bacterial_blight | Bacterial blight |
| Sugarcane__healthy | Healthy |
| Sugarcane__red_rot | Red rot |
| Sugarcane__red_stripe | Red stripe |
| Sugarcane__rust | Rust |

### Tea
| Class | Disease |
|-------|---------|
| Tea__algal_leaf | Algal leaf |
| Tea__anthracnose | Anthracnose |
| Tea__bird_eye_spot | Bird eye spot |
| Tea__brown_blight | Brown blight |
| Tea__healthy | Healthy |
| Tea__red_leaf_spot | Red leaf spot |

### Tomato
| Class | Disease |
|-------|---------|
| Tomato__bacterial_spot | Bacterial spot |
| Tomato__early_blight | Early blight |
| Tomato__healthy | Healthy |
| Tomato__late_blight | Late blight |
| Tomato__leaf_mold | Leaf mold |
| Tomato__mosaic_virus | Mosaic virus |
| Tomato__septoria_leaf_spot | Septoria leaf spot |
| Tomato__spider_mites_(two_spotted_spider_mite) | Spider mites (two-spotted) |
| Tomato__target_spot | Target spot |
| Tomato__yellow_leaf_curl_virus | Yellow leaf curl virus |

### Wheat
| Class | Disease |
|-------|---------|
| Wheat__brown_rust | Brown rust |
| Wheat__healthy | Healthy |
| Wheat__septoria | Septoria |
| Wheat__yellow_rust | Yellow rust |

---

---

## Disease Type Classification

The `disease_type` field is inferred from the disease name using keyword matching. The possible values are:

| Type | Description | Example Keywords |
|------|-------------|------------------|
| `fungal` | Fungal infections | rust, mildew, blight, rot, spot, scab, mold, anthracnose, septoria, blast, scorch |
| `bacterial` | Bacterial infections | bacterial |
| `viral` | Viral diseases | virus, mosaic, streak |
| `pest` | Insect / mite damage | whitefly, mite, caterpillar, hispa |
| `physiological` | Environmental / nutritional disorders | curl, yellowish, mottle |
| `healthy` | No disease | healthy |
| `unknown` | Could not be classified | diseased (general) |

---

## Dependencies

```
tensorflow 2.16.1
keras 3.3
fastapi
pydantic
Pillow
numpy
boto3
```

## Notes

- The model is a **3-member ensemble** (EfficientNetV2B0, ResNet101V2, MobileNetV2) — each sub-model outputs softmax probabilities (range [0, 1]), combined via a custom `weighted_sum` layer with weights `[0.2, 0.3, 0.5]` (range [0, 1]), then clipped to produce final confidence values.
- Images are fetched from an **S3-compatible object store** (Storj) configured via `config.env`.
