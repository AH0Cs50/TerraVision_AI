# TerraVision AI — API Reference

Base URL: `http://localhost:5500/api/v1`

All responses follow the format:
```json
{ "success": true|false, "data": { ... }, "message": "...", "status": <http_code> }
```

Authenticated endpoints require:
```
Authorization: Bearer <access_token>
```

---

## Enum Reference

All enum-constrained fields. Values are case-sensitive.

### User

| Field | Values |
|-------|--------|
| `role` | `user`, `admin` |

### Location

| Field | Constraints |
|-------|------------|
| `location.city` | String, 2–120 chars, letters/spaces/hyphens only |
| `location.coordinates.lat` | Number, -90 to 90 |
| `location.coordinates.lon` | Number, -180 to 180 |

> `location` requires exactly one of `city` or `coordinates`.

### Plant

| Field | Values |
|-------|--------|
| `category` | `crop`, `tree`, `flower` |
| `family` | `leafy_greens`, `fruiting_nightshade`, `succulent`, `root_crops`, `brassicas`, `legumes`, `herbs`, `tropical`, `citrus`, `vines`, `grasses`, `flowering_ornamentals` |
| `growthStage` | `germination`, `seedling`, `vegetative`, `flowering`, `fruiting`, `mature` |
| `soil.type` | `sandy`, `alfisols`, `aridisols`, `entisols`, `inceptisols`, `vertisols` |
| `soil.moisture` | Number, 0–100 |
| `watering.hoursSinceLastWatering` | Number, ≥ 0 |
| `stress.diseaseType` | `bacterial`, `fungal`, `none` |
| `stress.severity` | `high`, `medium`, `none` |
| `disease.name` | `healthy` (default) or any string |
| `disease.confidence` | Number, 0.0–1.0 |

### Care Status (output only)

| Field | Values |
|-------|--------|
| `status.water` | `thirsty`, `low`, `satisfied`, `overwatered` |
| `status.nutrients` | `needs_feed`, `low`, `optimal`, `excess` |
| `status.health` | `healthy`, `warning`, `diseased`, `critical` |
| `status.light` | `low`, `optimal`, `high`, `burn_risk` |

### Tasks

| Field | Values |
|-------|--------|
| `type` | `watering`, `fertilizing`, `pruning`, `disease_treatment`, `move_light`, `harvest` |
| `priority` | `low`, `medium`, `high` |
| `status` | `pending`, `in_progress`, `completed`, `cancelled` |
| `generatedBy` | `ai`, `system`, `user` |

### Action Logs

| Field | Values |
|-------|--------|
| `actionType` | `watered`, `fertilized`, `disease_scan`, `disease_detected`, `task_completed`, `task_added`, `task_updated`, `task_cancelled`, `light_changed`, `harvested`, `plant_analysis`, `plant_created`, `plant_updated`, `plant_deleted`, `image_uploaded`, `image_removed`, `plant_data_extracted`, `insight_generated` |

---

## Auth Endpoints

All mounted under `/api/v1/auth`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/signup` | ✗ | Registers a new user with name, email, password, location. Returns user UUID + JWT token pair. Emails must be unique (409 on duplicate). |
| POST | `/login` | ✗ | Authenticates by email+password. Returns user profile (uuid, email, role) + JWT token pair. |
| POST | `/refresh` | ✗ | Rotates both access + refresh tokens using a valid refreshToken body field. Invalidates the old refresh token. |
| POST | `/logout` | ✓ | Clears the stored refresh token from DB, terminating the session. |

### POST /auth/signup

Creates a new user account. Validates name, email, password, and location. Hashes password with bcrypt, generates JWT access+refresh tokens, stores refresh token in DB. Returns 201 on success, 409 on duplicate email.

```http
POST /api/v1/auth/signup
Content-Type: application/json

{
  "name": "Farmer Joe",
  "email": "joe@farm.com",
  "password": "securePassword123",
  "location": { "city": "Nairobi" }
}
```

```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "success": true,
  "message": "User created",
  "data": {
    "user": {
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Farmer Joe",
      "email": "joe@farm.com",
      "role": "user",
      "isverified": true,
      "location": { "city": "Nairobi" },
      "createdAt": "2026-03-15T12:00:00Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
  }
}
```

### POST /auth/login

Authenticates user by email+password. Verifies password against bcrypt hash, generates new JWT token pair, stores refresh token in DB. Returns user profile (uuid, name, email, role, isverified, location) + tokens.

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "joe@farm.com",
  "password": "securePassword123"
}
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "user": {
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Farmer Joe",
      "email": "joe@farm.com",
      "role": "user",
      "isverified": true,
      "location": { "city": "Nairobi" },
      "createdAt": "2026-03-15T12:00:00Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
  }
}
```

### POST /auth/refresh

Validates the provided refreshToken, issues a new access+refresh token pair. Invalidates the old refresh token in DB. Used when access token expires (401).

```http
POST /api/v1/auth/refresh
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### POST /auth/logout

Clears the stored refresh token from the user's DB record. Requires valid JWT access token in Authorization header. Terminates the session.

```http
POST /api/v1/auth/logout
Authorization: Bearer <access_token>
```

```http
HTTP/1.1 200 OK
{ "success": true, "message": "Logged out successfully" }
```

---

## User Endpoints

All mounted under `/api/v1/users`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/:id` | ✓ | Returns the authenticated user's profile: name, email, role, location, isVerified. |
| PUT | `/:id` | ✓ | Updates user profile fields (name, location, etc.). Partial updates supported. |
| DELETE | `/:id` | ✓(admin) | Permanently deletes a user account. Requires admin role. |
| POST | `/email` | ✓ | Sends an email verification link to the user's registered email via nodemailer. |
| GET | `/email` | ✓ | Returns `{ isVerified: boolean }` for the authenticated user's email. |
| GET | `/email/verify` | ✗ | Verifies email using a token from the verification email query string `?token=`. |

### GET /users/:id

Returns the authenticated user's profile. The :id param is the user's UUID. Includes name, email, role, location, and email verification status. Only the owner or admin can access.

```http
GET /api/v1/users/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <access_token>
```

```http
HTTP/1.1 200 OK
{
  "success": true,
  "data": {
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Farmer Joe",
    "email": "joe@farm.com",
    "role": "user",
    "location": { "city": "Nairobi" },
    "isVerified": true
  }
}
```

### PUT /users/:id

Updates user profile fields. Accepts partial JSON body (name, location). Only the owner can update. Returns updated user object.

```http
PUT /api/v1/users/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Farmer Joe Updated"
}
```

### DELETE /users/:id

Permanently deletes a user account. Admin-only — requires `authorize("admin")` middleware. Also removes associated plants and data.

Admin-only. Requires `authorize("admin")`.

```http
DELETE /api/v1/users/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <access_token>
```

### POST /users/email

Sends an email verification link to the user's registered email address. Uses SMTP (nodemailer) with config from config.env. Idempotent — resends if already called.

```http
POST /api/v1/users/email
Authorization: Bearer <access_token>
```

```http
HTTP/1.1 200 OK
{ "success": true, "message": "Verification email sent" }
```

### GET /users/email

Returns the email verification status for the authenticated user: `{ isVerified: boolean }`. No body required.

```http
GET /api/v1/users/email
Authorization: Bearer <access_token>
```

```http
HTTP/1.1 200 OK
{
  "success": true,
  "data": { "isVerified": false }
}
```

### GET /users/email/verify

Verifies a user's email address using the token sent in the verification email. Public endpoint — no auth required. Query parameter: `?token=`. Returns success message.

```http
GET /api/v1/users/email/verify?token=abc123
```

```http
HTTP/1.1 200 OK
{ "success": true, "message": "Email verified successfully" }
```

---

## Plant Endpoints

All mounted under `/api/v1/plants`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | ✓ | Lists all plants belonging to the authenticated user. Returns an array of plant objects. |
| POST | `/` | ✓ | Creates a new plant for the authenticated user. Accepts name, category, family, growthStage, soil, watering, plantedAt. |
| GET | `/:id` | ✓ | Retrieves a single plant by UUID. Returns full plant document (all fields). |
| PUT | `/:id` | ✓ | Updates a plant's fields (name, growthStage, soil, watering, etc.). Partial updates supported. |
| DELETE | `/:id` | ✓ | Permanently deletes a plant and its associated S3 images. |
| POST | `/image/upload` | ✗ | Returns a signed S3 upload URL for public/general images. Path: `general/images/{ts}-{fileName}`. |
| POST | `/user/image/upload` | ✓ | Returns a signed S3 upload URL scoped to the authenticated user. Path: `users/{userId}/images/{ts}-{fileName}`. |
| POST | `/image/extract` | ✓ | Uses Google Gemini Vision to extract structured plant data (family, growthStage, health) from an uploaded image. No plant doc created — caller persists. |
| POST | `/detect` | ✗ | Runs disease detection on a general image via the CNN ensemble ML microservice. Returns prediction with top-k classes. |
| POST | `/:id/image/upload` | ✓ | Returns a signed S3 upload URL scoped to a specific plant. Path: `plants/{userId}/{plantId}/images/{ts}-{fileName}`. |
| POST | `/:id/detect` | ✓ | Detects disease on a stored plant image via ML microservice. Updates the plant's disease field and returns detection + history. |
| DELETE | `/:id/images` | ✓ | Removes a plant's image from S3 using its key. Does not delete the plant document. |

### GET /plants

Lists all plants belonging to the authenticated user. Returns an array of plant objects with key fields (uuid, name, category, family, growthStage). No pagination.

```http
GET /api/v1/plants
Authorization: Bearer <access_token>
```

```http
HTTP/1.1 200 OK
{
  "success": true,
  "data": [
    {
      "uuid": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Tomato Plant 1",
      "category": "crop",
      "family": "fruiting_nightshade",
      "growthStage": "vegetative"
    }
  ]
}
```

### POST /plants

Creates a new plant document for the authenticated user. Accepts name, category, family, growthStage, plantedAt, soil, watering, and optional stress fields. Returns the created plant with UUID. Care state is NOT created here — only on first POST /analyze.

```http
POST /api/v1/plants
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Tomato Plant 1",
  "category": "crop",
  "family": "fruiting_nightshade",
  "growthStage": "vegetative",
  "plantedAt": "2026-03-15T00:00:00Z",
  "soil": { "type": "sandy", "moisture": 60 },
  "watering": { "hoursSinceLastWatering": 5 }
}
```

```http
HTTP/1.1 201 Created
{
  "success": true,
  "data": {
    "uuid": "660e8400-e29b-41d4-a716-446655440001",
    "name": "Tomato Plant 1",
    "category": "crop",
    "family": "fruiting_nightshade",
    "growthStage": "vegetative",
    "ageDays": 0
  }
}
```

### GET /plants/:id

Retrieves a single plant by its UUID. Returns the full plant document including all fields: category, family, growthStage, soil, watering, disease, stress, images, and timestamps.

```http
GET /api/v1/plants/660e8400-e29b-41d4-a716-446655440001
Authorization: Bearer <access_token>
```

### PUT /plants/:id

Updates a plant's fields. Accepts partial updates (name, growthStage, soil, watering, stress, disease). Validates enum constraints. Returns the updated plant document.

```http
PUT /api/v1/plants/660e8400-e29b-41d4-a716-446655440001
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Updated Tomato",
  "growthStage": "flowering"
}
```

### DELETE /plants/:id

Permanently deletes the plant document and its associated S3 images. Requires ownership. Returns success message. Cannot be undone.

```http
DELETE /api/v1/plants/660e8400-e29b-41d4-a716-446655440001
Authorization: Bearer <access_token>
```

### POST /plants/image/upload (Public — General)

Returns a signed S3 upload URL for public (unauthenticated) image uploads. Accepts fileName + fileType. Path format: `general/images/{timestamp}-{fileName}`. URL expires in 1 hour. Used in Flow 3 (quick disease detection).

```http
POST /api/v1/plants/image/upload
Content-Type: application/json

{
  "fileName": "unknown_leaf.jpg",
  "fileType": "image/jpeg"
}
```

```http
HTTP/1.1 200 OK
{
  "success": true,
  "data": {
    "uploadUrl": "https://gateway.storjshare.io/plant/general/images/1712345679-unknown_leaf.jpg?...",
    "key": "general/images/1712345679-unknown_leaf.jpg",
    "expiresIn": 3600
  }
}
```

> S3 path: `general/images/{timestamp}-{fileName}`

### POST /plants/user/image/upload (Auth — User-Scoped)

Returns a signed S3 upload URL scoped to the authenticated user. Path: `users/{userId}/images/{timestamp}-{fileName}`. Used in Flow 1 (onboarding a new plant) before image extraction.

```http
POST /api/v1/plants/user/image/upload
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "fileName": "my_plant.jpg",
  "fileType": "image/jpeg"
}
```

```http
HTTP/1.1 200 OK
{
  "success": true,
  "data": {
    "uploadUrl": "https://gateway.storjshare.io/plant/users/user-uuid/images/1712345679-my_plant.jpg?...",
    "key": "users/user-uuid/images/1712345679-my_plant.jpg",
    "expiresIn": 3600
  }
}
```

> S3 path: `users/{userId}/images/{timestamp}-{fileName}`

### POST /plants/image/extract (Auth — Pre-Plant Extraction)

Uses **Google Gemini Vision** to extract structured plant data (family, growth stage, health, etc.) from an uploaded S3 image. Takes the S3 key from a prior upload. No plant document required — pure extraction, caller persists the data.

```http
POST /api/v1/plants/image/extract
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "key": "users/user-uuid/images/1712345679-my_plant.jpg"
}
```

```http
HTTP/1.1 200 OK
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

### POST /plants/detect (Public — General Detection)

Runs disease detection on a general (unauthenticated) S3 image via the Python ML microservice (CNN ensemble with 88 disease classes). Returns prediction with class, confidence, and top-k alternatives.

```http
POST /api/v1/plants/detect
Content-Type: application/json

{
  "key": "general/images/1712345679-unknown_leaf.jpg"
}
```

```http
HTTP/1.1 200 OK
{
  "success": true,
  "data": {
    "image_key": "general/images/1712345679-unknown_leaf.jpg",
    "prediction": {
      "class": { "plant": "Apple", "disease": "scab", "disease_type": "fungal" },
      "confidence": 0.87,
      "top_k": [
        { "class": { "plant": "Apple", "disease": "scab", "disease_type": "fungal" }, "confidence": 0.87 },
        { "class": { "plant": "Apple", "disease": "rust", "disease_type": "fungal" }, "confidence": 0.05 }
      ]
    }
  }
}
```

### POST /plants/:id/image/upload (Auth — Plant-Scoped)

Returns a signed S3 upload URL scoped to a specific plant. Path: `plants/{userId}/{plantId}/images/{timestamp}-{fileName}`. Used in Flow 2 (disease detection on existing plant). The returned key is later passed to `/:id/detect`.

```http
POST /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/image/upload
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "fileName": "tomato_leaf.jpg",
  "fileType": "image/jpeg"
}
```

```http
HTTP/1.1 200 OK
{
  "success": true,
  "data": {
    "uploadUrl": "https://gateway.storjshare.io/plant/plants/user-uuid/plant-uuid/images/1712345678-tomato_leaf.jpg?...",
    "key": "plants/user-uuid/plant-uuid/images/1712345678-tomato_leaf.jpg",
    "expiresIn": 3600
  }
}
```

> S3 path: `plants/{userId}/{plantId}/images/{timestamp}-{fileName}`

### POST /plants/:id/detect (Auth — Plant Disease Detection)

Detects disease on a stored plant S3 image via the Python ML microservice (CNN ensemble, 88 classes). Updates the plant's disease field with name + confidence. Returns current detection + full disease history array. Errors (ML down) return healthy fallback.

```http
POST /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/detect
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "key": "plants/user-uuid/plant-uuid/images/1712345678-tomato_leaf.jpg"
}
```

```http
HTTP/1.1 200 OK
{
  "success": true,
  "data": {
    "disease": {
      "name": "early blight",
      "confidence": 0.94,
      "detectedAt": "2026-03-15T12:00:00Z"
    },
    "diseaseHistory": [
      {
        "name": "early blight",
        "confidence": 0.94,
        "detectedAt": "2026-03-15T12:00:00Z"
      }
    ]
  }
}
```

### DELETE /plants/:id/images

Removes a plant's image from S3 storage. Requires the S3 key in the request body. Does NOT delete the plant document itself. Silently logs S3 errors (never throws).

```http
DELETE /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/images
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "key": "plants/user-uuid/plant-uuid/images/1712345678-tomato_leaf.jpg"
}
```

```http
HTTP/1.1 200 OK
{
  "success": true,
  "message": "Image removed successfully"
}
```

---

## Plant Care Endpoints

All mounted under `/api/v1/plants`. **Authentication is applied at the router level** — all endpoints require a valid JWT.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/:id/analyze` | Runs the 7-layer rule engine (global→soil→family→growth→watering→pest→light) with plant data + weather. Creates/updates care state with scores and statuses. |
| GET | `/:id/care-state` | Returns the current care state document including engine scores (waterScore, fertilizerScore, pestRiskScore, lightScore) and status mappings. |
| GET | `/:id/logs` | Retrieves action logs for the plant. Supports pagination (?page=&limit=), last N (?last=N), and type filtering (?type=). |
| POST | `/:id/logs` | Creates a manual action log entry. Requires actionType (watered, fertilized, disease_scan, etc.) and optional description. |
| DELETE | `/:id/logs` | Deletes logs older than a date (?before=iso-date). Returns count of deleted logs. |
| PATCH | `/:id/water` | Waters the plant. Resets hoursSinceLastWatering, auto-completes matching watering tasks, re-runs analysis, conditionally generates tasks, produces AI insights. Returns `{ status, aiInsights, activeTasks }`. |
| POST | `/:id/fertilize` | Fertilizes the plant. Updates soil.lastFertilized, auto-completes matching fertilizing tasks, re-runs analysis, conditionally generates tasks, produces AI insights. Returns `{ status, aiInsights, activeTasks }`. |
| POST | `/:id/harvest` | Harvests the plant. Updates lastHarvestedAt, auto-completes matching harvest tasks, re-runs analysis, conditionally generates tasks, produces AI insights. Returns `{ status, aiInsights, activeTasks }`. |
| PATCH | `/:id/light` | Adjusts light condition. Accepts `{ lightCondition }`. Auto-completes matching move_light tasks, re-runs analysis, conditionally generates tasks, produces AI insights. Returns `{ status, aiInsights, activeTasks }`. |
| POST | `/:id/treat-disease` | Treats disease on the plant. Resets disease state, auto-completes matching disease_treatment tasks, re-runs analysis, conditionally generates tasks, produces AI insights. Returns `{ status, aiInsights, activeTasks }`. |
| POST | `/:id/prune` | Prunes the plant. Updates soil.lastPruned, auto-completes matching pruning tasks, re-runs analysis, conditionally generates tasks, produces AI insights. Returns `{ status, aiInsights, activeTasks }`. |
| GET | `/:id/tasks` | Returns paginated active tasks (read-only — tasks are auto-completed by actions). Supports ?page=&limit=. |
| GET | `/:id/tasks/overdue` | Returns tasks where dueDate has passed and status is still pending/in_progress. |
| GET | `/:id/tasks/pending` | Returns all tasks with status = pending for the plant. |
| GET | `/:id/tasks/prioritized` | Returns active tasks sorted by priority (high → medium → low). |
| POST | `/:id/ai-insights` | Generates AI-powered care insights for the plant using Google Gemini. Returns natural-language recommendations. |
| POST | `/:id/ai-insights/ask` | Asks a specific question about the plant to Gemini. Accepts { question: string }. Returns AI answer with plant context. |

### POST /plants/:id/analyze

Runs the 7-layer rule engine (global → soil → family → growth → watering → pest → light) against current plant data + upstream weather. Creates or updates the care state document with scores [0.5–2.0] and statuses for water, nutrients, health, light. Weather failures attach a warning but don't crash.

```http
POST /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/analyze
Authorization: Bearer <access_token>
```

```http
HTTP/1.1 200 OK
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

### GET /plants/:id/care-state

Returns the full care state document for the plant. Includes engine scores (waterScore, fertilizerScore, pestRiskScore, lightScore) and their mapped statuses. Created only after the first POST /:id/analyze. Returns 404 if no analysis has been run.

```http
GET /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/care-state
Authorization: Bearer <access_token>
```

### GET /plants/:id/logs

Retrieves action logs for the plant. Supports query params: `?last=N` (most recent N), `?type=watered` (filter by actionType), `?page=1&limit=20` (paginated). Logs store both UUID + internalId for zero-lookup reads.

```http
GET /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/logs?last=5
Authorization: Bearer <access_token>
```

### POST /plants/:id/logs

Creates a manual action log entry. Requires `actionType` from the full enum (watered, fertilized, disease_scan, disease_detected, task_completed, task_added, task_updated, task_cancelled, light_changed, harvested, plant_analysis, plant_created, plant_updated, plant_deleted, image_uploaded, image_removed, plant_data_extracted, insight_generated) and optional `description`. Requires `user` object in context (not just UUID string).

```http
POST /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/logs
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "actionType": "watered",
  "description": "Watered the plant"
}
```

### DELETE /plants/:id/logs

Deletes action logs older than a given ISO date (`?before=2026-01-01T00:00:00Z`). Returns `{ deletedCount }`. Useful for periodic cleanup. Note: `deleteOlderThan` returns a number (0 = none deleted) — falsy check bug: `if (!result)` treats 0 as falsy.

```http
DELETE /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/logs?before=2026-01-01T00:00:00Z
Authorization: Bearer <access_token>
```

### PATCH /plants/:id/water

Waters the plant. Resets `hoursSinceLastWatering` to 0, auto-completes any matching `watering` tasks (archived, not stored in completedTasks), re-runs the 7-layer engine analysis, conditionally generates new tasks (only when care status is not fully optimal), and generates AI insights. All steps are individually caught — the endpoint returns 200 even if analysis/AI fails.

```http
PATCH /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/water
Authorization: Bearer <access_token>
```

```http
HTTP/1.1 200 OK
{
  "success": true,
  "message": "Plant watered",
  "data": {
    "status": { "water": "satisfied", "nutrients": "optimal", "health": "healthy", "light": "optimal" },
    "aiInsights": { "summary": "Your plant is well-hydrated...", "recommendations": [...] },
    "activeTasks": []
  }
}
```

### POST /plants/:id/fertilize

Fertilizes the plant. Updates `soil.lastFertilized` to now, auto-completes any matching `fertilizing` tasks (archived), re-runs the 7-layer engine analysis (new `soil_recently_fertilized_nutrient_sufficiency` rule reduces fertilizerScore by 0.3 if fertilized within 7 days), conditionally generates tasks, and produces AI insights.

```http
POST /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/fertilize
Authorization: Bearer <access_token>
```

```http
HTTP/1.1 200 OK
{
  "success": true,
  "message": "Plant fertilized",
  "data": {
    "status": { "water": "satisfied", "nutrients": "optimal", "health": "healthy", "light": "optimal" },
    "aiInsights": { "summary": "Nutrient levels are optimal...", "recommendations": [...] },
    "activeTasks": []
  }
}
```

### POST /plants/:id/harvest

Harvests the plant. Updates `lastHarvestedAt` timestamp, auto-completes any matching `harvest` tasks (archived), re-runs the 7-layer engine analysis, conditionally generates tasks, and produces AI insights.

```http
POST /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/harvest
Authorization: Bearer <access_token>
```

```http
HTTP/1.1 200 OK
{
  "success": true,
  "message": "Plant harvested",
  "data": {
    "status": { "water": "satisfied", "nutrients": "optimal", "health": "healthy", "light": "optimal" },
    "aiInsights": { "summary": "Post-harvest care recommended...", "recommendations": [...] },
    "activeTasks": []
  }
}
```

### PATCH /plants/:id/light

Adjusts light condition. Accepts `{ lightCondition }` (string). Auto-completes any matching `move_light` tasks (archived), re-runs the 7-layer engine analysis, conditionally generates tasks, and produces AI insights. Note: light condition is weather-dependent only — this action logs the change but the engine's light score is driven by weather data, not this field.

```http
PATCH /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/light
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "lightCondition": "partial_shade"
}
```

```http
HTTP/1.1 200 OK
{
  "success": true,
  "message": "Light condition updated",
  "data": {
    "status": { "water": "satisfied", "nutrients": "optimal", "health": "healthy", "light": "optimal" },
    "aiInsights": { "summary": "Light conditions are adequate...", "recommendations": [...] },
    "activeTasks": []
  }
}
```

### POST /plants/:id/treat-disease

Treats disease on the plant. Resets `disease.name` to `"healthy"` and `stress.diseaseType` to `"none"`, auto-completes any matching `disease_treatment` tasks (archived), re-runs the 7-layer engine analysis, conditionally generates tasks, and produces AI insights.

```http
POST /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/treat-disease
Authorization: Bearer <access_token>
```

```http
HTTP/1.1 200 OK
{
  "success": true,
  "message": "Disease treated",
  "data": {
    "status": { "water": "satisfied", "nutrients": "optimal", "health": "healthy", "light": "optimal" },
    "aiInsights": { "summary": "Disease has been treated...", "recommendations": [...] },
    "activeTasks": []
  }
}
```

### POST /plants/:id/prune

Prunes the plant. Updates `soil.lastPruned` to now, auto-completes any matching `pruning` tasks (archived), re-runs the 7-layer engine analysis, conditionally generates tasks, and produces AI insights.

```http
POST /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/prune
Authorization: Bearer <access_token>
```

```http
HTTP/1.1 200 OK
{
  "success": true,
  "message": "Plant pruned",
  "data": {
    "status": { "water": "satisfied", "nutrients": "optimal", "health": "healthy", "light": "optimal" },
    "aiInsights": { "summary": "Pruning completed successfully...", "recommendations": [...] },
    "activeTasks": []
  }
}
```

### GET /plants/:id/tasks

Returns paginated active tasks (read-only — tasks are auto-completed by performing the corresponding action, not manually). Supports `?page=1&limit=20`. Tasks are sorted by creation date (newest first).

```http
GET /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/tasks?page=1&limit=20
Authorization: Bearer <access_token>
```

### GET /plants/:id/tasks/overdue

Returns tasks whose dueDate has passed and status is still pending or in_progress. Useful for surfacing neglected care items. No pagination — returns all overdue tasks.

```http
GET /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/tasks/overdue
Authorization: Bearer <access_token>
```

### GET /plants/:id/tasks/pending

Returns all tasks with status = pending for the plant. Filters out completed, in_progress, and cancelled tasks. No pagination.

```http
GET /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/tasks/pending
Authorization: Bearer <access_token>
```

### GET /plants/:id/tasks/prioritized

Returns active tasks sorted by priority (high → medium → low). Within the same priority, tasks are ordered by creation date. Useful for rendering priority-ordered to-do lists.

```http
GET /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/tasks/prioritized
Authorization: Bearer <access_token>
```

### POST /plants/:id/ai-insights

Generates AI-powered care insights for the plant using Google Gemini. Takes the plant's current state (care status, growth stage, disease info) and returns natural-language recommendations. Uses 2.5-flash with fallback to 2.0-flash → 1.5-flash on 429/503.

```http
POST /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/ai-insights
Authorization: Bearer <access_token>
```

### POST /plants/:id/ai-insights/ask

Asks a specific question about the plant to Google Gemini. Accepts `{ question: string }`. Returns an AI-generated answer grounded in the plant's current context (species, growth stage, care status, disease). Same model fallback chain as /ai-insights.

```http
POST /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/ai-insights/ask
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "question": "Why is my plant wilting?"
}
```

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

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Invalid file type. Allowed: image/jpeg, image/png, image/webp"
}
```

```json
{
  "success": false,
  "message": "Validation failed",
  "status": 400,
  "details": [
    {
      "code": "invalid_type",
      "expected": "number",
      "received": "null",
      "path": ["soil", "moisture"],
      "message": "Expected number, received null"
    }
  ]
}
```

### 401 Unauthorized

```json
{ "success": false, "message": "Access token expired" }
```

### 403 Forbidden

```json
{ "success": false, "message": "Access denied. Insufficient permissions" }
```

### Common Status Codes

| Code | When |
|------|------|
| 400 | Validation failure, missing fields, invalid file type |
| 401 | Missing/invalid/expired JWT |
| 403 | Insufficient role permissions |
| 404 | Resource not found (plant, user, care state) |
| 409 | Duplicate email during signup |
| 500 | Unexpected internal errors |

---

## API Flows — User Experience

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

### Flow 3: Quick Disease Detection (No Auth, No Plant Context)

```
Step 1: Upload general image
  POST /api/v1/plants/image/upload       { fileName, fileType }
  → { uploadUrl, key }                    # key: "general/images/..."

Step 2: Upload binary image to S3
  PUT <uploadUrl>

Step 3: Detect disease
  POST /api/v1/plants/detect             { key }
  → { prediction: { class, confidence, top_k } }
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
  POST /api/v1/auth/login  { user_email, password }
  → { uuid, accessToken, refreshToken, role }

Step 3: Use access token for API calls
  Authorization: Bearer <accessToken>

Step 4: When access token expires (401)
  POST /api/v1/auth/refresh  { refreshToken }
  → { accessToken, refreshToken }         # rotated

Step 5: Log out
  POST /api/v1/auth/logout                # clears refresh token from DB
```

---

## S3 Key Patterns

| Pattern | Endpoint | Example |
|---------|----------|---------|
| `general/images/{timestamp}-{fileName}` | `POST /image/upload` (public) | `general/images/1712345679-unknown_leaf.jpg` |
| `users/{userId}/images/{timestamp}-{fileName}` | `POST /user/image/upload` (auth) | `users/abc123/images/1712345679-my_plant.jpg` |
| `plants/{userId}/{plantId}/images/{timestamp}-{fileName}` | `POST /:id/image/upload` (auth) | `plants/abc123/plant456/images/1712345678-tomato_leaf.jpg` |
