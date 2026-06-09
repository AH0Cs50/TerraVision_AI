# Plant Disease Detection API

FastAPI microservice for plant disease classification using a TensorFlow/Keras ensemble CNN model.

---

## Endpoint

### `POST /predict`

Plant-specific detection. Filters top-k predictions to only the user's plant type.

**Request body:**

```json
{
  "user_id": "u123",
  "plant_id": "p456",
  "key": "plants/user_uuid/plant_uuid/images/leaf.jpg",
  "expected_plant": "Tomato"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | `string` | User identifier |
| `plant_id` | `string` | Plant identifier |
| `key` | `string` | S3 object key (Storj) pointing to the plant image |
| `expected_plant` | `string` | (optional) Plant name to narrow predictions |

### `POST /predict/general`

No-user detection. Returns global top-k across all 88 classes (no plant filtering).

**Request body:**

```json
{
  "key": "general/images/12345-leaf.jpg"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `key` | `string` | S3 object key pointing to the uploaded image |

**Response (both endpoints use the same format):**

```json
{
  "success": true,
  "user_id": "u123",
  "plant_id": "p456",
  "image_key": "plants/user_uuid/plant_uuid/images/leaf.jpg",
  "prediction": {
    "class": {
      "plant": "Tomato",
      "disease": "early blight",
      "disease_type": "fungal"
    },
    "confidence": 0.87,
    "top_k": [
      { "class": { "plant": "Tomato", "disease": "early blight", "disease_type": "fungal" }, "confidence": 0.87 },
      { "class": { "plant": "Tomato", "disease": "late blight", "disease_type": "fungal" }, "confidence": 0.06 },
      { "class": { "plant": "Tomato", "disease": "healthy", "disease_type": "healthy" }, "confidence": 0.03 },
      { "class": { "plant": "Tomato", "disease": "leaf mold", "disease_type": "fungal" }, "confidence": 0.02 },
      { "class": { "plant": "Tomato", "disease": "target spot", "disease_type": "fungal" }, "confidence": 0.01 }
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

**Error response:**

```json
{
  "success": false,
  "error": "error description"
}
```

---

## Input preprocessing

1. Image fetched from S3 (Storj) via the provided `key`
2. Converted to RGB (3 channels)
3. Resized to **224×224** pixels using **NEAREST-neighbor interpolation** (matches training)
4. Converted to `float32` and normalized to `[0, 1]` (divided by 255)
5. Batch dimension added → final shape `(1, 224, 224, 3)`

---

## Model details

| Property | Value |
|----------|-------|
| Architecture | 3-member ensemble CNN |
| Framework | TensorFlow 2.16 / Keras 3.3 |
| Input size | `(1, 224, 224, 3)` RGB |
| Output | 88-class softmax (per branch), combined via weighted sum `[0.2, 0.3, 0.5]` |

---

## Supported classes (88)

### Apple
- Apple black rot, Apple healthy, Apple rust, Apple scab

### Cassava
- Cassava bacterial blight, Cassava brown streak disease, Cassava green mottle, Cassava healthy, Cassava mosaic disease

### Cherry
- Cherry healthy, Cherry powdery mildew

### Chili
- Chili healthy, Chili leaf curl, Chili leaf spot, Chili whitefly, Chili yellowish

### Coffee
- Coffee cercospora leaf spot, Coffee healthy, Coffee red spider mite, Coffee rust

### Corn
- Corn common rust, Corn gray leaf spot, Corn healthy, Corn northern leaf blight

### Cucumber
- Cucumber diseased, Cucumber healthy

### Guava
- Gauva diseased, Gauva healthy

### Grape
- Grape black measles, Grape black rot, Grape healthy, Grape leaf blight (isariopsis leaf spot)

### Jamun
- Jamun diseased, Jamun healthy

### Lemon
- Lemon diseased, Lemon healthy

### Mango
- Mango diseased, Mango healthy

### Peach
- Peach bacterial spot, Peach healthy

### Pepper
- Pepper bell bacterial spot, Pepper bell healthy

### Pomegranate
- Pomegranate diseased, Pomegranate healthy

### Potato
- Potato early blight, Potato healthy, Potato late blight

### Rice
- Rice brown spot, Rice healthy, Rice hispa, Rice leaf blast, Rice neck blast

### Soybean
- Soybean bacterial blight, Soybean caterpillar, Soybean diabrotica speciosa, Soybean downy mildew, Soybean healthy, Soybean mosaic virus, Soybean powdery mildew, Soybean rust, Soybean southern blight

### Strawberry
- Strawberry leaf scorch, Strawberry healthy

### Sugarcane
- Sugarcane bacterial blight, Sugarcane healthy, Sugarcane red rot, Sugarcane red stripe, Sugarcane rust

### Tea
- Tea algal leaf, Tea anthracnose, Tea bird eye spot, Tea brown blight, Tea healthy, Tea red leaf spot

### Tomato
- Tomato bacterial spot, Tomato early blight, Tomato healthy, Tomato late blight, Tomato leaf mold, Tomato mosaic virus, Tomato septoria leaf spot, Tomato spider mites (two spotted spider mite), Tomato target spot, Tomato yellow leaf curl virus

### Wheat
- Wheat brown rust, Wheat healthy, Wheat septoria, Wheat yellow rust

---

## Running locally

```bash
pip install -r requirement.txt
uvicorn app.main:app --reload --port 5000
```

Start the FastAPI development server on `http://localhost:8000`.

### Testing

```bash
python app/test.py
```

Iterates over images in `test_images/`, runs prediction, and prints top-5 results.

---

## Environment

Configure `config.env` with Storj S3-compatible credentials:

```
REGION=...
BUCKET_NAME=...
ENDPOINT=...
ACCESS_KEY=...
SECRET_KEY=...
```
