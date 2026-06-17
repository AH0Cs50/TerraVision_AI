# API Documentation — Disease Detection & ML Service

## Backend Disease Detection Endpoints (via Express API)

All require `Authorization: Bearer <accessToken>` unless noted.

### POST `/api/v1/plants/user/image/upload` (see plants doc)
Generates pre-signed S3 URL for user image at path `users/{userId}/images/{timestamp}-{fileName}`

### POST `/api/v1/plants/user/image/detect` (authenticated)
**Purpose:** Detect disease on a user-uploaded image (no plant yet — exploratory)
**Request:** `{ key: string }` (S3 object key returned from upload)
**Flow:**
1. Validate key via `s3CloudService.validateUserImageKey(key)`
2. POST to ML service `/predict` with `{ key, user_id }`
3. On ML failure → return fallback `{ disease: "healthy", confidence: 1 }`
4. Simplify response → format top predictions
**Response:** `{ disease, plant, confidence, disease_type, topPredictions[] }`

### POST `/api/v1/plants/:id/detect` (authenticated)
**Purpose:** Detect disease on a plant's image and persist result
**Request:** `{ key: string }` (S3 key relative to plant's base path)
**Flow:**
1. `plantService.verifyPlantAccess(id, user.uuid, user.role)` → Plant entity
2. Resolve full S3 key (prepend basePath if needed)
3. `detectAndSaveDisease({ key, userId, plantId, expectedPlant })`
   - Validate via `validatePlantImageKey(key)`
   - POST to ML `/predict` with `{ key, user_id, plant_uuid, expected_plant }`
   - On failure: return fallback `{ name: "healthy", confidence: 1 }`
   - `plant.recordDiseaseDetection({ name, confidence, detectedAt })` → delta
   - `plantRepo.updateByUUID(plantUUID, delta)` → saves disease + appends to diseaseHistory
4. Log `disease_detected` action
**Response:** `{ disease, diseaseHistory }` with optional `model` info

---

## ML Service — Endpoints

**Base URL:** `http://127.0.0.1:8000` (configured via `DISEASE_DETECTION_URL` env var, default `http://127.0.0.1:8000`)

### GET `/` (Health Check)

**Purpose:** Verify ML service is running.

**Response (200):**
```json
{
  "message": "ML service is running",
  "status": "healthy",
  "version": "1.0"
}
```

---

## ML Service — `/predict` Endpoint

### POST `/predict`
**Purpose:** Run CNN ensemble inference on an S3-stored plant image

**Request Body (Pydantic model):**
```json
{
  "key": "string (required) — S3 object key of image",
  "user_id": "string (optional) — user UUID",
  "plant_uuid": "string (optional) — plant UUID",
  "expected_plant": "string (optional) — plant name hint for filtering"
}
```

**Processing Flow:**
1. Fetch image bytes from Storj S3 via boto3 (`get_file_by_key`)
2. Validate image (ContentType must start with `image/`, body non-empty)
3. Decode bytes to PIL Image, convert RGB
4. Preprocess: resize to 224x224 (LANCZOS interpolation), normalize to [0,1], add batch dim → shape (1, 224, 224, 3)
5. Run model inference → weighted ensemble average:
   - EfficientNetV2B0 (weight 0.2)
   - ResNet101V2 (weight 0.3)
   - MobileNetV2 (weight 0.5)
6. Temperature scaling (T=2.0): softens overconfident probabilities
7. If `expected_plant` provided: filter predictions to matching plant classes only
8. Compute top-5 predictions + uncertainty metrics (confidence_delta, entropy)

**Model Architecture:**
- 3-model CNN ensemble (single `plant.keras` file, ~1.04 GB)
- Custom `weighted_sum` Lambda layer for ensemble averaging
- 88 output classes (20 plant types × disease/health states)
- Class naming: `{PlantName}__{disease_name}` (e.g., `Tomato__early_blight`)
- Disease types: fungal, bacterial, viral, pest, physiological, healthy

**Success Response:**
```json
{
  "success": true,
  "image_key": "string",
  "prediction": {
    "class": { "plant": "string", "disease": "string", "disease_type": "string" },
    "confidence": 0.95,
    "confidence_delta": 0.12,
    "entropy": 0.45,
    "top_k": [
      { "class": { "plant": "...", "disease": "...", "disease_type": "..." }, "confidence": 0.95 },
      ...
    ]
  },
  "model": { "name": "plant-disease-cnn", "version": "1.0.0", "input_size": [224, 224] },
  "processing": { "inference_time_ms": 245.3, "timestamp": "2026-06-16T12:00:00Z" }
}
```

**Error Response (HTTP 200 with error flag — non-standard):**
```json
{
  "success": false,
  "error": "Error message string"
}
```

**Fallback Behavior (Backend side):**
- If ML service is unreachable (network error) → backend returns `{ name: "healthy", confidence: 1 }`
- If ML returns `success: false` → same healthy fallback
- If image key validation fails on backend → 400 Bad Request
- All fallbacks ensure the system never crashes due to ML service downtime

**Class Labels:** 88 classes across **23 plant types**, each with multiple disease/health states:
| Plant | Plant | Plant |
|-------|-------|-------|
| Apple | Cassava | Cherry |
| Chili | Coffee | Corn |
| Cucumber | Guava | Grape |
| Jamun | Lemon | Mango |
| Peach | Pepper_bell | Pomegranate |
| Potato | Rice | Soybean |
| Strawberry | Sugarcane | Tea |
| Tomato | Wheat | |

Class naming convention: `{PlantName}__{disease_name}` (e.g., `Tomato__early_blight`, `Apple__healthy`).
Disease types: `fungal`, `bacterial`, `viral`, `pest`, `physiological`, `healthy`.

**Model Architecture:**
- 3-model CNN ensemble: EfficientNetV2B0 (weight 0.2), ResNet101V2 (weight 0.3), MobileNetV2 (weight 0.5)
- Single `plant.keras` file (~1.04 GB) with custom `weighted_sum` Lambda layer
- Input: 224×224×3 RGB, normalized [0,1]
- Temperature scaling (T=2.0) softens overconfident probabilities
- Custom `uncertainty` metric via confidence delta and entropy

**Notable:**
- Code uses **LANCZOS** interpolation in `Image.resize()`, despite some docs claiming NEAREST
- ML service has **no CORS middleware** — only reachable server-side via backend proxy
- Errors return HTTP 200 with `success: false` (not standard HTTP error codes)
- Inference time varies; typical range 150–350ms per image on CPU
- Model expects S3-hosted images — does not accept direct file uploads
