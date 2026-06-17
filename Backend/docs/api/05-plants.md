# API Documentation — Plant & Plant Care Module

> **Health Check:** `GET /` (no auth) returns `"Server is running"` (plain text, not JSON). Located at app root, not under `/api/v1`.

## Plant Module

Base URL: `/api/v1/plants`

All Plant routes require `Authorization: Bearer <accessToken>`. Authentication is applied per-route via the `authenticate` middleware.

### Common Response Envelope:
```json
{ "success": true, "message": "...", "data": {...}, "status": 200 }
```

### Enums (Plant Model)

**Families (12):**
`leafy_greens`, `fruiting_nightshade`, `succulent`, `root_crops`, `brassicas`, `legumes`, `herbs`, `tropical`, `citrus`, `vines`, `grasses`, `flowering_ornamentals`

**Growth Stages (6):**
`germination`, `seedling`, `vegetative`, `flowering`, `fruiting`, `mature`

**Soil Types (6):**
`sandy`, `alfisols`, `aridisols`, `entisols`, `inceptisols`, `vertisols`

**Categories (3):**
`crop`, `tree`, `flower`

### Extended Enums

**User Role:**
| Field | Values |
|-------|--------|
| `role` | `user`, `admin` |

**Location (on user):**
| Field | Constraints |
|-------|------------|
| `location.city` | String, 2–120 chars, letters/spaces/hyphens only |
| `location.coordinates.lat` | Number, -90 to 90 |
| `location.coordinates.lon` | Number, -180 to 180 |

> `location` requires exactly one of `city` or `coordinates`.

**Care Status Values (output only, from engine scoring):**

| Field | Values |
|-------|--------|
| `status.water` | `thirsty`, `low`, `satisfied`, `overwatered` |
| `status.nutrients` | `needs_feed`, `low`, `optimal`, `excess` |
| `status.health` | `healthy`, `warning`, `diseased`, `critical` |
| `status.light` | `low`, `optimal`, `high`, `burn_risk` |

**Task Fields:**

| Field | Values |
|-------|--------|
| `type` | `watering`, `fertilizing`, `pruning`, `disease_treatment`, `move_light`, `harvest` |
| `priority` | `low`, `medium`, `high` |
| `status` | `pending`, `in_progress`, `completed`, `cancelled` |
| `generatedBy` | `ai`, `system`, `user` |

**Action Log Types (18):**
`watered`, `fertilized`, `disease_scan`, `disease_detected`, `task_completed`, `task_added`, `task_updated`, `task_cancelled`, `light_changed`, `harvested`, `plant_analysis`, `plant_created`, `plant_updated`, `plant_deleted`, `image_uploaded`, `image_removed`, `plant_data_extracted`, `insight_generated`

---

## Plant Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/user/image/upload` | ✓ | Generate pre-signed S3 PUT URL for user-scoped image upload |
| POST | `/user/image/detect` | ✓ | Detect disease on a user-uploaded image (no plant yet) |
| POST | `/image/extract` | ✓ | Extract plant data from image via Gemini LLM |
| GET | `/` | ✓ | List current user's plants |
| POST | `/` | ✓ | Create a new plant |
| GET | `/:id` | ✓ | Get single plant by UUID |
| PUT | `/:id` | ✓ | Update plant fields (partial) |
| DELETE | `/:id` | ✓ | Delete plant and all associated data |
| POST | `/:id/image/upload` | ✓ | Generate pre-signed S3 URL for plant-specific image |
| POST | `/:id/detect` | ✓ | Detect disease on a plant image |
| DELETE | `/:id/images` | ✓ | Remove an image from plant |

---

### POST `/user/image/upload`

**Purpose:** Generate a pre-signed S3 PUT URL for uploading a user-scoped image (before a plant is created). The client uploads directly to S3 using this URL.

**Request:**
```json
{
  "fileName": "my_plant.jpg",
  "fileType": "image/jpeg|image/png|image/webp"
}
```

**Flow:**
1. Health check S3 connection
2. Validate MIME type (throws `BAD_REQUEST` if invalid)
3. Build key path: `users/{userId}/images/{timestamp}-{fileName}`
4. Sign PUT URL with `s3Config.signedUrlExpiresIn` (5 minutes)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://gateway.storjshare.io/plant/users/{userId}/images/{timestamp}-{fileName}?...",
    "key": "users/{userId}/images/{timestamp}-{fileName}",
    "expiresIn": 300
  }
}
```

**Use Case:** `uploadUserImage(user, fileName, fileType)` → `s3CloudService.generateUserUploadUrl()`

---

### POST `/user/image/detect`

**Purpose:** Run disease detection on a user-scoped S3 image via the ML microservice. Does NOT persist to any plant — returns the simplified prediction. Useful for quick one-off scans before plant creation.

**Request:**
```json
{
  "key": "users/{userId}/images/{timestamp}-{fileName}"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "disease": "early blight",
    "plant": "Tomato",
    "confidence": 0.87,
    "disease_type": "fungal",
    "topPredictions": [
      { "disease": "early blight", "plant": "Tomato", "confidence": 0.87 },
      { "disease": "late blight", "plant": "Tomato", "confidence": 0.06 },
      { "disease": "healthy", "plant": "Tomato", "confidence": 0.03 }
    ],
    "model": { "name": "cnn_ensemble", "version": "1.0" }
  }
}
```

**Fallback:** If the ML microservice is unreachable or returns an error, defaults to `{ disease: "healthy", plant: "unknown", confidence: 1, disease_type: "healthy", topPredictions: [] }`.

**Key validation:** Must match pattern `users/{userId}/images/{timestamp}-{fileName}`. Validated via `s3CloudService.validateUserImageKey()`.

**Use Case:** `detectUserImageDisease(key, user)` → `disease-detection.usecase.js:detectUserImageDisease()`

---

### POST `/image/extract`

**Purpose:** Extract structured plant data from an uploaded S3 image using Google Gemini Vision. No plant document is created — the caller persists the extracted data.

**Request:**
```json
{
  "key": "users/{userId}/images/{timestamp}-{fileName}"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "category": "crop",
    "family": "fruiting_nightshade",
    "growthStage": "vegetative",
    "health": "diseased",
    "summary": "This appears to be a tomato plant in vegetative stage showing signs of early blight."
  }
}
```

**Use Case:** `extractPlantDataFromImage(key)` → `plantVisionService.extractImageData(key)`

---

### GET `/`

**Purpose:** List all plants belonging to the authenticated user.

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "uuid": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Tomato Plant 1",
      "commonName": "Tomato",
      "category": "crop",
      "family": "fruiting_nightshade",
      "growthStage": "vegetative",
      "plantedAt": "2026-03-15T00:00:00.000Z",
      "soil": { "type": "sandy", "moisture": 60 },
      "watering": { "hoursSinceLastWatering": 5 },
      "ageDays": 93
    }
  ]
}
```

**Note:** No pagination — returns all plants for the user. Plants are not paginated in the current implementation.

**Use Case:** `getUserPlants(user)` → `userRepo.findByUUID(uuid)` → `plantRepo.findByUserInternalId(internalId)`

---

### POST `/`

**Purpose:** Create a new plant for the authenticated user.

**Request Body (validated via Zod PlantDTO):**
```json
{
  "name": "Tomato Plant 1",
  "commonName": "Roma Tomato",
  "category": "crop",
  "family": "fruiting_nightshade",
  "plantedAt": "2026-03-15T00:00:00Z",
  "growthStage": "vegetative",
  "soil": {
    "type": "sandy",
    "moisture": 60
  },
  "watering": {
    "hoursSinceLastWatering": 5
  }
}
```

| Field | Required | Type | Constraints |
|-------|----------|------|-------------|
| `name` | ✓ | string | 2–100 chars |
| `category` | ✓ | enum | `crop`, `tree`, `flower` |
| `family` | ✓ | enum | One of 12 families |
| `plantedAt` | ✓ | date | ISO date string or Date |
| `soil.type` | ✓ | enum | One of 6 soil types |
| `soil.moisture` | | number | 0–100, nullable |
| `growthStage` | | enum | Optional, auto-derived via LLM if missing |
| `commonName` | | string | 2–100 chars |
| `ageDays` | | number | Optional, auto-computed from `plantedAt` if missing |
| `watering.hoursSinceLastWatering` | | number | ≥ 0 |

**Flow:**
1. Resolve user `internalId` via `userRepo.findByUUID(uuid)`
2. Compute `ageDays` from `plantedAt` (or provided `ageDays`)
3. If `growthStage` is missing, derive via LLM (`deriveGrowthStage`): sends prompt with plant name, family, category, ageDays; falls back to `"vegetative"`
4. Derive `expectedHarvestDate` via LLM (`deriveExpectedHarvestDate`): sends prompt with plant details; fallback: crop=90d, flower=60d, tree=365d from `plantedAt`
5. Create plant in DB
6. Log `plant_created` via `plantCareActionLogger`

**Success Response (201):**
```json
{
  "success": true,
  "message": "Plant created successfully",
  "data": {
    "uuid": "660e8400-e29b-41d4-a716-446655440001",
    "name": "Tomato Plant 1",
    "category": "crop",
    "family": "fruiting_nightshade",
    "growthStage": "vegetative",
    "ageDays": 0,
    "expectedHarvestDate": "2026-06-13T00:00:00.000Z"
  },
  "status": 201
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Validation failed (Zod validation errors) |

**Use Case:** `createPlant(data, user)` → `plantRepo.create()`

---

### GET `/:id`

**Purpose:** Get a single plant by its UUID.

**Access Control:** Owner or admin — enforced by `plantService.verifyPlantAccess(uuid, user.uuid, user.role)`. Throws 404 (not found) if user is not the owner (hides existence).

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "uuid": "660e8400-e29b-41d4-a716-446655440001",
    "name": "Tomato Plant 1",
    "category": "crop",
    "family": "fruiting_nightshade",
    "growthStage": "vegetative",
    "plantedAt": "2026-03-15T00:00:00.000Z",
    "expectedHarvestDate": "2026-06-13T00:00:00.000Z",
    "soil": { "type": "sandy", "moisture": 60 },
    "watering": { "hoursSinceLastWatering": 5 },
    "disease": { "name": "healthy", "confidence": 1 },
    "diseaseHistory": [],
    "stress": { "diseaseType": "none", "severity": "none" },
    "cdn": { "basePath": "", "images": [] },
    "ageDays": 93,
    "hasDisease": false,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Use Case:** `getPlant(plantUUID, user)` → `plantService.verifyPlantAccess()`

---

### PUT `/:id`

**Purpose:** Update plant fields. Supports partial updates via `PlantDTO.partial()` Zod schema.

**Request Body (partial):**
```json
{
  "name": "Updated Tomato",
  "growthStage": "flowering",
  "soil": { "moisture": 70 }
}
```

**Flow:**
1. `plantService.verifyPlantAccess()` — owner or admin gate
2. Compute `ageDays` from provided `plantedAt` or existing plant's `plantedAt`
3. `plantRepo.updateByUUID(uuid, { ...updateData, ageDays })`
4. Log `plant_updated`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Plant updated successfully",
  "data": { "...": "updated plant object" }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 404 | Plant not found or access denied |

**Use Case:** `updatePlant(plantUUID, user, updateData)` → `plantRepo.updateByUUID()`

---

### DELETE `/:id`

**Purpose:** Permanently delete a plant and all associated data.

**Flow:**
1. `plantService.verifyPlantAccess()` — owner or admin gate
2. Delete all S3 images in parallel: `Promise.all(images.map(fileName => s3CloudService.deleteFile(basePath + fileName)))`
3. Log `plant_deleted`
4. Delete all action logs: `actionLogRepo.deleteByPlantUUID(plantUUID)`
5. Delete care state: `plantCareStateService.deleteByPlantUUID(plantUUID)`
6. Delete plant record: `plantRepo.deleteByUUID(plantUUID)`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Plant deleted successfully"
}
```

**Note:** This operation is irreversible. All S3 images, action logs, and care state are removed.

**Use Case:** `deletePlant(plantUUID, user)`

---

### POST `/:id/image/upload`

**Purpose:** Generate a pre-signed S3 PUT URL for uploading an image scoped to a specific plant. The key is stored in the plant's `cdn.images` array.

**Request:**
```json
{
  "fileName": "tomato_leaf.jpg",
  "fileType": "image/jpeg"
}
```

**Flow:**
1. `plantService.verifyPlantAccess()` — owner or admin
2. `s3CloudService.generateUploadUrl()` → builds key `plants/{userId}/{plantId}/images/{timestamp}-{fileName}`
3. `plant.addImage(imageName)` → delta adds image name to `cdn.images`
4. If `cdn.images` was empty, also set `cdn.basePath` via `plant.setBasePath()`
5. `plantRepo.updateByUUID(uuid, delta)`
6. Log `image_uploaded`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Upload form generated",
  "data": {
    "uploadUrl": "https://gateway.storjshare.io/plant/plants/{userId}/{plantId}/images/{timestamp}-{fileName}?...",
    "key": "plants/{userId}/{plantId}/images/{timestamp}-{fileName}",
    "expiresIn": 300
  }
}
```

**S3 path:** `plants/{userId}/{plantId}/images/{timestamp}-{fileName}`

**Use Case:** `uploadPlantPhoto(plantUUID, user, fileName, fileType)` → `s3CloudService.generateUploadUrl()`

---

### POST `/:id/detect`

**Purpose:** Detect disease on a stored plant image via the ML microservice. Updates the plant's `disease` field and records the result in `diseaseHistory`. Fallback on ML failure: returns "healthy" with 1.0 confidence.

**Request:**
```json
{
  "key": "plants/{userId}/{plantId}/images/{timestamp}-{fileName}"
}
```

The key can be the full S3 key or just a filename (if relative, `cdn.basePath` is prepended).

**Flow:**
1. `plantService.verifyPlantAccess()` — owner or admin
2. Resolve full S3 key (prepend `cdn.basePath` if key doesn't contain `/`)
3. `detectAndSaveDisease()` → POST to ML service `/predict` with `{ key, user_id, plant_uuid, expected_plant }`
4. `plant.recordDiseaseDetection(diseaseRecord)` → creates delta updating `disease` and appending to `diseaseHistory`
5. `plantRepo.updateByUUID(uuid, delta)`
6. Log `disease_detected`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Disease detection completed",
  "data": {
    "disease": {
      "name": "early blight",
      "confidence": 0.94,
      "detectedAt": "2026-03-15T12:00:00.000Z"
    },
    "diseaseHistory": [
      { "name": "early blight", "confidence": 0.94, "detectedAt": "2026-03-15T12:00:00.000Z" }
    ],
    "model": { "name": "cnn_ensemble", "version": "1.0" }
  }
}
```

**Fallback:** If the ML service is unreachable, `disease.name` defaults to `"healthy"` with `confidence: 1`.

**Use Case:** `detectPlantDisease(plantUUID, user, key)` → `disease-detection.usecase.js:detectAndSaveDisease()`

---

### DELETE `/:id/images`

**Purpose:** Remove a specific image from a plant's S3 storage and `cdn.images` array.

**Request:**
```json
{
  "key": "plants/{userId}/{plantId}/images/{timestamp}-{fileName}"
}
```

**Flow:**
1. `plantService.verifyPlantAccess()` — owner or admin
2. Resolve full S3 key
3. `s3CloudService.deleteFile(fullKey)` — delete from S3
4. Extract filename from key
5. `plant.removeImage(fileName)` → delta removes from `cdn.images`
6. If `cdn.images` becomes empty, also clear `cdn.basePath` via `plant.setBasePath("")`
7. `plantRepo.updateByUUID(uuid, delta)`
8. Log `image_removed`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Image removed successfully"
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 404 | Image key not found in plant's image list (returns "nothing to remove") |

**Use Case:** `removePlantImage(plantUUID, user, key)` → `s3CloudService.deleteFile()` + `plantRepo.updateByUUID()`

---

## Plant Care Module

Base URL: `/api/v1/plants`

All Plant Care routes require `Authorization: Bearer <accessToken>`. Authentication is applied at the router level — all endpoints require a valid JWT.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/:id/analyze` | ✓ | Full plant analysis via 131-rule engine |
| GET | `/:id/care-state` | ✓ | Get current care state |
| GET | `/:id/logs` | ✓ | Get action logs (filtered/paginated) |
| POST | `/:id/logs` | ✓ | Manually add action log |
| DELETE | `/:id/logs` | ✓ | Clear old logs |
| PATCH | `/:id/water` | ✓ | Record watering action |
| POST | `/:id/fertilize` | ✓ | Record fertilizing action |
| POST | `/:id/harvest` | ✓ | Record harvest action |
| PATCH | `/:id/light` | ✓ | Update light condition |
| POST | `/:id/treat-disease` | ✓ | Treat disease (reset to healthy) |
| POST | `/:id/prune` | ✓ | Record pruning action |
| GET | `/:id/tasks` | ✓ | List tasks (paginated) |
| GET | `/:id/tasks/overdue` | ✓ | List overdue tasks |
| GET | `/:id/tasks/pending` | ✓ | List pending tasks |
| GET | `/:id/tasks/prioritized` | ✓ | List tasks sorted by priority |
| POST | `/:id/ai-insights` | ✓ | Generate AI care insights via Gemini |
| POST | `/:id/ai-insights/ask` | ✓ | Ask a question about the plant to Gemini |

---

### POST `/:id/analyze`

**Purpose:** Run the full 7-layer rule engine against current plant data and upstream weather (if user has location set). Creates or updates the care state document.

**Flow:**
1. `plantService.verifyPlantAccess()` — owner or admin
2. Build engine plant input via `plant.getEnginePlantInput()`
3. Fetch weather data from user's location (optional — if `user.location` exists):
   - `weatherService.getWeather(location)` → transform → `weatherDescriber.weatherDescribeForEngine()`
   - Weather failures are caught and attached as `_weatherWarning` (non-blocking)
4. Run `evaluate({ weather, ...plantInput })` → 131-rule engine across 7 layers (Global → Soil → Plant Family → Growth Stage → Watering History → Pest/Disease → Light)
5. `plantCareStateService.saveEngineOutput(plantUUID, engineResult)` → save scores and statuses to care state
6. Log `plant_analysis`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Plant analysis completed",
  "data": {
    "status": {
      "water": "low",
      "nutrients": "optimal",
      "health": "healthy",
      "light": "low"
    }
  }
}
```

**Engine Scores (in metadata/log):**
| Score | Range | Description |
|-------|-------|-------------|
| `waterScore` | 0.5–2.0 | Watering needs |
| `fertilizerScore` | 0.5–2.0 | Nutrient needs |
| `pestRiskScore` | 0.5–2.0 | Pest/disease risk |
| `lightScore` | 0.5–2.0 | Light adequacy |

**Use Case:** `plant-analyser.usecase.js:analyzeAndSavePlant(plantUUID, user)`

---

### GET `/:id/care-state`

**Purpose:** Get the current care state document for a plant. Created only after the first `POST /:id/analyze`.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Care state retrieved successfully",
  "data": {
    "plantUUID": "660e8400-e29b-41d4-a716-446655440001",
    "status": {
      "water": "low",
      "nutrients": "optimal",
      "health": "healthy",
      "light": "low"
    },
    "engineScores": {
      "waterScore": 1.8,
      "fertilizerScore": 1.2,
      "pestRiskScore": 0.8,
      "lightScore": 1.5
    },
    "activeTasks": [],
    "aiInsights": {
      "summary": "Your plant needs more water...",
      "recommendations": ["Water immediately", "Check soil moisture daily"]
    }
  }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 404 | No care state found (plant has never been analyzed) |

**Use Case:** `getCareState(plantUUID)` → `plantCareStateService.getByPlantUUID()`

---

### GET `/:id/logs`

**Purpose:** Retrieve action logs for the plant. Supports multiple query modes.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `last` | number | 5 | Return most recent N logs |
| `type` | string | — | Filter by `actionType` (overrides `last`/`page`) |
| `page` | number | 1 | Page number (requires `limit`) |
| `limit` | number | 20 | Items per page (requires `page`) |

**Query precedence:** `type` filter → `page`/`limit` pagination → `last` N recent (default 5)

**Examples:**
```
GET /api/v1/plants/{id}/logs?last=5
GET /api/v1/plants/{id}/logs?type=watered
GET /api/v1/plants/{id}/logs?page=1&limit=20
```

**Action type enum:** `watered`, `fertilized`, `disease_scan`, `disease_detected`, `task_completed`, `task_added`, `task_updated`, `task_cancelled`, `light_changed`, `harvested`, `plant_analysis`, `plant_created`, `plant_updated`, `plant_deleted`, `image_uploaded`, `image_removed`, `plant_data_extracted`, `insight_generated`

**Use Case:** `getLogs(plantUUID, { type, page, limit, last })` → delegates to `plantCareActionLogger`

---

### POST `/:id/logs`

**Purpose:** Manually add an action log entry.

**Request:**
```json
{
  "actionType": "watered",
  "description": "Watered the plant manually",
  "metadata": { "volume": "500ml" }
}
```

**Flow:**
1. Resolve `userInternalId` and `plantInternalId`
2. Create action log via `plantCareActionLogger.addActionLog()`

**Success Response (201):**
```json
{
  "success": true,
  "message": "Action log added",
  "status": 201
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | `actionType` or `description` missing |

**Use Case:** `addActionLog(plantUUID, user, { actionType, description, metadata })`

---

### DELETE `/:id/logs`

**Purpose:** Delete action logs older than a given date.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `before` | ISO date | `new Date()` | Delete logs before this date |

**Example:**
```
DELETE /api/v1/plants/{id}/logs?before=2026-01-01T00:00:00Z
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Old logs cleared",
  "data": { "deletedCount": 5 }
}
```

**Note:** Returns `{ deletedCount: 0 }` if no logs matched. If the care state is not found, returns 404.

**Use Case:** `clearOldLogs(plantUUID, before)` → `plantCareActionLogger.clearOldLogs()`

---

### PATCH `/:id/water`

**Purpose:** Record a watering action. Resets `hoursSinceLastWatering` to 0.

**Flow (via `performAction`):**
1. `plantService.verifyPlantAccess()` → get Plant entity
2. `plant.applyWatering(0)` → delta `{ "watering.hoursSinceLastWatering": 0 }`
3. `plantRepo.updateByUUID(uuid, delta)`
4. Complete matching `watering` task from care state (archive)
5. Log `{ actionType: "watered", description: "Plant watered" }`
6. Re-analyze (run engine → save care state)
7. If status is not fully optimal, auto-generate new tasks
8. Generate AI insights via Gemini
9. Save insights to care state

**Success Response (200):**
```json
{
  "success": true,
  "message": "Plant watered",
  "data": {
    "status": { "water": "satisfied", "nutrients": "optimal", "health": "healthy", "light": "optimal" },
    "aiInsights": { "summary": "Your plant is well-hydrated...", "recommendations": ["Maintain current schedule"] },
    "activeTasks": []
  }
}
```

---

### POST `/:id/fertilize`

**Purpose:** Record a fertilizing action. Updates `soil.lastFertilized` to current timestamp.

**Flow:** Standard `performAction` pipeline with:
- Entity method: `plant.applyFertilizing()` → delta `{ "soil.lastFertilized": new Date() }`
- Task type: `fertilizing`
- Log: `{ actionType: "fertilized", description: "Plant fertilized" }`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Plant fertilized",
  "data": { "status": {...}, "aiInsights": {...}, "activeTasks": [] }
}
```

---

### POST `/:id/harvest`

**Purpose:** Record a harvest action. Sets `growthStage` to `"mature"`.

**Flow:** Standard `performAction` pipeline with:
- Entity method: `plant.applyHarvest()` → delta `{ growthStage: "mature" }`
- Task type: `harvest`
- Log: `{ actionType: "harvested", description: "Plant harvested" }`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Plant harvested",
  "data": { "status": {...}, "aiInsights": {...}, "activeTasks": [] }
}
```

---

### PATCH `/:id/light`

**Purpose:** Record a light condition change. Note: no entity delta is applied — light score is weather-driven. The action creates a log entry and triggers re-analysis.

**Request:**
```json
{
  "lightCondition": "partial_shade"
}
```

**Flow:** Standard `performAction` pipeline with:
- Entity method: `async () => ({})` (no-op delta)
- Task type: `move_light`
- Log: `{ actionType: "light_changed", description: "Light conditions changed", metadata: { lightCondition } }`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Light condition updated",
  "data": { "status": {...}, "aiInsights": {...}, "activeTasks": [] }
}
```

---

### POST `/:id/treat-disease`

**Purpose:** Treat disease on the plant. Resets disease state to healthy.

**Flow:** Standard `performAction` pipeline with:
- Entity method: `plant.applyDiseaseTreatment()` → resets `disease.name` to `"healthy"`, `stress.diseaseType` to `"none"`
- Task type: `disease_treatment`
- Log: `{ actionType: "disease_scan", description: "Disease scan performed" }`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Disease treated",
  "data": { "status": {...}, "aiInsights": {...}, "activeTasks": [] }
}
```

---

### POST `/:id/prune`

**Purpose:** Record a pruning action. Updates `soil.lastPruned` to current timestamp.

**Flow:** Standard `performAction` pipeline with:
- Entity method: `plant.applyPruning()` → delta `{ "soil.lastPruned": new Date() }`
- Task type: `pruning`
- Log: `{ actionType: "pruned", description: "Plant pruned" }`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Plant pruned",
  "data": { "status": {...}, "aiInsights": {...}, "activeTasks": [] }
}
```

---

### Common Action Flow (all care actions)

All 6 care actions (water, fertilize, harvest, light, treat-disease, prune) share the same `performAction` pipeline in `plant-care-action.usecase.js`:

```
verifyPlantAccess → entity delta → repo.updateByUUID → complete matching task → log → re-analyze → generate tasks → AI insights → return { status, aiInsights, activeTasks }
```

**Error isolation:** Each step is wrapped in its own try/catch. Individual step failures are caught and logged, but the action still succeeds. Errors are accumulated in an internal `errors` array (not returned to the client).

**Conditional task generation:** New tasks are only auto-generated when the care status is not fully optimal (`water !== "satisfied"` OR `nutrients !== "optimal"` OR `health !== "healthy"` OR `light !== "optimal"`).

---

### GET `/:id/tasks`

**Purpose:** Get paginated active tasks for the plant.

**Query Parameters:**
| Param | Type | Default |
|-------|------|---------|
| `page` | number | 1 |
| `limit` | number | 20 |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Tasks retrieved successfully",
  "data": [
    {
      "taskId": "abc-123",
      "type": "watering",
      "priority": "high",
      "status": "pending",
      "dueDate": "2026-03-16T00:00:00.000Z",
      "description": "Water the plant"
    }
  ]
}
```

**Note:** Returns unwrapped array from `result.tasks` — not a paginated wrapper object.

**Use Case:** `getTasks(plantUUID, page, limit)` → `plantTaskCareManager.paginateTasks()`

---

### GET `/:id/tasks/overdue`

**Purpose:** Get tasks where `dueDate` has passed and status is still `pending` or `in_progress`.

**Use Case:** `getOverdueTasks(plantUUID)` → `plantTaskCareManager.getOverdueTasks()`

### GET `/:id/tasks/pending`

**Purpose:** Get all tasks with status `"pending"` for the plant.

**Use Case:** `getPendingTasks(plantUUID)` → `plantTaskCareManager.getPendingTasks()`

### GET `/:id/tasks/prioritized`

**Purpose:** Get active tasks sorted by priority (high → medium → low).

**Use Case:** `getPrioritizedTasks(plantUUID)` → `plantTaskCareManager.prioritizeTasks()`

---

### POST `/:id/ai-insights`

**Purpose:** Generate AI-powered care insights for the plant using Google Gemini. Uses the current care state and recent action logs as context.

**Flow:**
1. Fetch care state via `plantCareStateService.getByPlantUUID()`
2. Fetch recent 100 action logs
3. `plantCareAiInsights.generateInsights(plantUUID, status, logs)` → Gemini LLM
4. Log `insight_generated`

**Success Response (200):**
```json
{
  "success": true,
  "message": "AI insights generated",
  "data": {
    "summary": "Your tomato plant is in vegetative stage with adequate water but low light levels...",
    "recommendations": [
      "Increase light exposure to 6+ hours daily",
      "Maintain current watering schedule",
      "Monitor for signs of nutrient deficiency"
    ]
  }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 404 | Care state not found (plant never analyzed) |

**Use Case:** `generateAiInsights(plantUUID, user)` → `plantCareAiInsights.generateInsights()`

---

### POST `/:id/ai-insights/ask`

**Purpose:** Ask a specific question about the plant. Gemini answers using the plant's care state and log history as context.

**Request:**
```json
{
  "question": "Should I move my tomato plant to more sunlight?"
}
```

**Flow:**
1. Validate `question` is provided
2. Fetch care state
3. Fetch recent 100 action logs
4. `plantCareAiInsights.answerQuestion(plantUUID, question, logs)` → Gemini LLM

**Success Response (200):**
```json
{
  "success": true,
  "message": "Question answered",
  "data": {
    "answer": "Based on your plant's light score of 1.5 and current vegetative stage, moving it to partial sunlight for 4-6 hours daily would improve growth..."
  }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | `question` is missing |
| 404 | Care state not found |

**Use Case:** `askQuestion(plantUUID, question)` → `plantCareAiInsights.answerQuestion()`

---

## Response Trimming

Several endpoints return only a subset of the full resource:

| Endpoint | Returns |
|----------|---------|
| `POST /:id/analyze` | `{ status }` — water, nutrients, health, light |
| `POST /:id/detect` | `{ disease, diseaseHistory }` |
| `PATCH /:id/water` | `{ status, aiInsights, activeTasks }` |
| `POST /:id/fertilize` | `{ status, aiInsights, activeTasks }` |
| `POST /:id/harvest` | `{ status, aiInsights, activeTasks }` |
| `PATCH /:id/light` | `{ status, aiInsights, activeTasks }` |
| `POST /:id/treat-disease` | `{ status, aiInsights, activeTasks }` |
| `POST /:id/prune` | `{ status, aiInsights, activeTasks }` |

---

## S3 Key Patterns

| Pattern | Endpoint | Example |
|---------|----------|---------|
| `users/{userId}/images/{timestamp}-{fileName}` | `POST /user/image/upload` | `users/abc123/images/1712345679-my_plant.jpg` |
| `plants/{userId}/{plantId}/images/{timestamp}-{fileName}` | `POST /:id/image/upload` | `plants/abc123/plant456/images/1712345678-tomato_leaf.jpg` |

---

## API Flows

### Flow 1: Onboarding a New Plant

The recommended sequence to add a plant with AI-assisted data extraction:

```
Step 1: Upload user image → get signed S3 URL (user-scoped)
  POST /api/v1/plants/user/image/upload  { fileName, fileType }
  → { uploadUrl, key }                    # key: "users/{userId}/images/..."

Step 2: Upload image binary directly to S3
  PUT <uploadUrl>                         # binary image data, no JSON

Step 3: Extract plant data from the uploaded image via LLM Vision
  POST /api/v1/plants/image/extract       { key }
  → { category, family, growthStage, health, summary }

Step 4: Create the plant using extracted data
  POST /api/v1/plants                     { name, category, family, ... }
  → { uuid, ... }                         # plant UUID for subsequent operations
```

**Diagram:**
```
User Device                    API Server                    Storj S3
    │                              │                            │
    ├── POST /user/image/upload ──►│                            │
    │◄──── { uploadUrl, key } ─────┤                            │
    │                              │                            │
    ├── PUT <uploadUrl> ───────────┼───────────────────────────►│
    │◄───────── 200 OK ────────────┼────────────────────────────┤
    │                              │                            │
    ├── POST /image/extract ──────►│                            │
    │                              ├── getObjectBuffer(key) ───►│
    │                              │◄──────── buffer ──────────┤
    │                              ├── Gemini Vision ──────►    │
    │◄── { category, family, ... }─┤                            │
    │                              │                            │
    ├── POST /plants ─────────────►│                            │
    │◄── { uuid, ... } ───────────┤                            │
```

### Flow 2: Disease Detection on an Existing Plant

```
Step 1: Upload plant photo
  POST /api/v1/plants/:id/image/upload  { fileName, fileType }
  → { uploadUrl, key }                    # key: "plants/{userId}/{plantId}/..."

Step 2: Upload binary image to S3
  PUT <uploadUrl>

Step 3: Detect disease
  POST /api/v1/plants/:id/detect         { key }
  → { disease: { name, confidence }, diseaseHistory }
```

### Flow 3: Quick Disease Detection (User-Scoped, No Plant Required)

Quickly detect disease on any image without creating a plant. Useful for scouting or one-off checks.

```
Step 1: Upload user image → get signed S3 URL (user-scoped)
  POST /api/v1/plants/user/image/upload   { fileName, fileType }
  → { uploadUrl, key }                     # key: "users/{userId}/images/..."

Step 2: Upload binary image to S3
  PUT <uploadUrl>

Step 3: Detect disease (no plant persistence)
  POST /api/v1/plants/user/image/detect   { key }
  → { disease, plant, confidence, disease_type, topPredictions }
```

### Flow 4: Full Care Cycle

```
Step 1: Analyze plant
  POST /api/v1/plants/:id/analyze
  → { status: { water, nutrients, health, light } }

Step 2: View current care state
  GET /api/v1/plants/:id/care-state
  → full care state with engine scores

Step 3: Perform care actions (each auto-completes matching tasks, re-runs analysis, generates tasks if needed, produces AI insights)
  PATCH /api/v1/plants/:id/water         # water the plant
  POST  /api/v1/plants/:id/fertilize     # fertilize the plant
  POST  /api/v1/plants/:id/harvest       # harvest the plant
  PATCH /api/v1/plants/:id/light         # adjust light condition
  POST  /api/v1/plants/:id/treat-disease # treat disease
  POST  /api/v1/plants/:id/prune         # prune the plant
  → { status, aiInsights, activeTasks }

Step 4: View active tasks (auto-generated from care status)
  GET /api/v1/plants/:id/tasks

Step 5: Get AI recommendations
  POST /api/v1/plants/:id/ai-insights
  → AI-generated care recommendations
```

### Flow 5: Authentication Lifecycle

```
Step 1: Create account
  POST /api/v1/auth/signup  { name, email, password, location }
  → { uuid, accessToken, refreshToken }

Step 2: Log in (existing user)
  POST /api/v1/auth/login  { email, password }
  → { uuid, accessToken, refreshToken, role }

Step 3: Use access token for API calls
  Authorization: Bearer <accessToken>

Step 4: When access token expires (401)
  POST /api/v1/auth/refresh  { refreshToken }
  → { accessToken, refreshToken }         # rotated

Step 5: Log out
  POST /api/v1/auth/logout                # clears refresh token from DB
```
