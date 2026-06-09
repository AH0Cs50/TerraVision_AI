# TerraVision AI — API Reference

Base URL: `http://localhost:5500/api/v1`

All responses follow the format:
```json
{ "success": true|false, "data": { ... }, "message": "..." }
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
| `actionType` | `watered`, `fertilized`, `disease_scan`, `task_completed`, `task_added`, `task_updated`, `task_cancelled`, `light_changed`, `harvested` |

---

## Auth Endpoints

All mounted under `/api/v1/auth`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/signup` | ✗ | Register a new user |
| POST | `/login` | ✗ | Authenticate and get tokens |
| POST | `/refresh` | ✗ | Rotate access/refresh tokens |
| POST | `/logout` | ✓ | Clear refresh token |

### POST /auth/signup

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
  "message": "User created successfully",
  "data": {
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### POST /auth/login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "user_email": "joe@farm.com",
  "password": "securePassword123"
}
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "email": "joe@farm.com",
    "role": "user",
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### POST /auth/refresh

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
| GET | `/:id` | ✓ | Get user profile |
| PUT | `/:id` | ✓ | Update user profile |
| DELETE | `/:id` | ✓(admin) | Delete user |
| POST | `/email` | ✓ | Send verification email |
| GET | `/email` | ✓ | Get email verification status |
| GET | `/email/verify` | ✗ | Verify email (query: `?token=`) |

### GET /users/:id

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

```http
PUT /api/v1/users/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Farmer Joe Updated"
}
```

### DELETE /users/:id

Admin-only. Requires `authorize("admin")`.

```http
DELETE /api/v1/users/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <access_token>
```

### POST /users/email

```http
POST /api/v1/users/email
Authorization: Bearer <access_token>
```

```http
HTTP/1.1 200 OK
{ "success": true, "message": "Verification email sent" }
```

### GET /users/email

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
| GET | `/` | ✓ | List user's plants |
| POST | `/` | ✓ | Create a new plant |
| GET | `/:id` | ✓ | Get plant by UUID |
| PUT | `/:id` | ✓ | Update plant |
| DELETE | `/:id` | ✓ | Delete plant |
| POST | `/image/upload` | ✗ | Get signed S3 URL (general, public) |
| POST | `/user/image/upload` | ✓ | Get signed S3 URL (user-scoped) |
| POST | `/image/extract` | ✓ | Extract plant data from image via LLM |
| POST | `/detect` | ✗ | Detect disease (general, public) |
| POST | `/:id/image/upload` | ✓ | Get signed S3 URL (plant-scoped) |
| POST | `/:id/detect` | ✓ | Detect disease on plant image |
| DELETE | `/:id/images` | ✓ | Remove plant image |

### GET /plants

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

```http
GET /api/v1/plants/660e8400-e29b-41d4-a716-446655440001
Authorization: Bearer <access_token>
```

### PUT /plants/:id

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

```http
DELETE /api/v1/plants/660e8400-e29b-41d4-a716-446655440001
Authorization: Bearer <access_token>
```

### POST /plants/image/upload (Public — General)

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

Uses **Google Gemini Vision** to extract structured plant data (family, growth stage, health, etc.) from an image. No plant document required — pure extraction, caller persists the data.

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

Detects disease on a stored plant image via the ML microservice (CNN ensemble).

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
| POST | `/:id/analyze` | Run rule engine analysis |
| GET | `/:id/care-state` | Get current care state |
| GET | `/:id/logs` | Get action logs (?last=N, ?type=, ?page=&limit=) |
| POST | `/:id/logs` | Add manual action log |
| DELETE | `/:id/logs` | Clear old logs (?before=date) |
| PATCH | `/:id/water` | Log watering (quick action) |
| POST | `/:id/fertilize` | Log fertilizing (quick action) |
| POST | `/:id/harvest` | Log harvest (quick action) |
| PATCH | `/:id/light` | Log light change |
| GET | `/:id/tasks` | Get tasks (paginated) |
| POST | `/:id/tasks` | Add manual task |
| POST | `/:id/tasks/generate` | Auto-generate tasks from care status |
| GET | `/:id/tasks/overdue` | Get overdue tasks |
| GET | `/:id/tasks/pending` | Get pending tasks |
| GET | `/:id/tasks/prioritized` | Get tasks sorted by priority |
| PATCH | `/:id/tasks/complete` | Mark task complete (auto-logs) |
| DELETE | `/:id/tasks/completed` | Archive completed tasks |
| PATCH | `/:id/tasks/:taskId/cancel` | Cancel a task |
| PATCH | `/:id/tasks/:taskId/reopen` | Reopen a completed task |
| POST | `/:id/ai-insights` | Generate AI insights |
| POST | `/:id/ai-insights/ask` | Ask AI a question about plant care |

### POST /plants/:id/analyze

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

```http
GET /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/care-state
Authorization: Bearer <access_token>
```

### GET /plants/:id/logs

```http
GET /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/logs?last=5
Authorization: Bearer <access_token>
```

### POST /plants/:id/logs

```http
POST /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/logs
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "actionType": "watered",
  "description": "Watered the plant"
}
```

### PATCH /plants/:id/water

```http
PATCH /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/water
Authorization: Bearer <access_token>
```

### POST /plants/:id/fertilize

```http
POST /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/fertilize
Authorization: Bearer <access_token>
```

### POST /plants/:id/harvest

```http
POST /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/harvest
Authorization: Bearer <access_token>
```

### PATCH /plants/:id/light

```http
PATCH /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/light
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "lightCondition": "partial_shade"
}
```

### GET /plants/:id/tasks

```http
GET /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/tasks?page=1&limit=20
Authorization: Bearer <access_token>
```

### POST /plants/:id/tasks

```http
POST /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/tasks
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "type": "watering",
  "title": "Water the plant",
  "priority": "high"
}
```

### POST /plants/:id/tasks/generate

```http
POST /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/tasks/generate
Authorization: Bearer <access_token>
```

### GET /plants/:id/tasks/overdue

```http
GET /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/tasks/overdue
Authorization: Bearer <access_token>
```

### GET /plants/:id/tasks/pending

```http
GET /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/tasks/pending
Authorization: Bearer <access_token>
```

### GET /plants/:id/tasks/prioritized

```http
GET /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/tasks/prioritized
Authorization: Bearer <access_token>
```

### PATCH /plants/:id/tasks/complete

```http
PATCH /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/tasks/complete
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "taskId": "task-uuid-here"
}
```

### DELETE /plants/:id/tasks/completed

```http
DELETE /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/tasks/completed
Authorization: Bearer <access_token>
```

### PATCH /plants/:id/tasks/:taskId/cancel

```http
PATCH /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/tasks/task-uuid-here/cancel
Authorization: Bearer <access_token>
```

### PATCH /plants/:id/tasks/:taskId/reopen

```http
PATCH /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/tasks/task-uuid-here/reopen
Authorization: Bearer <access_token>
```

### POST /plants/:id/ai-insights

```http
POST /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/ai-insights
Authorization: Bearer <access_token>
```

### POST /plants/:id/ai-insights/ask

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
| `POST /:id/tasks` | `activeTasks` array |
| `PATCH /:id/tasks/complete` | `{ task, activeTasks, completedTasks }` |
| `PATCH /:id/tasks/:taskId/cancel` | `{ task, activeTasks }` |
| `PATCH /:id/tasks/:taskId/reopen` | `{ task, activeTasks, completedTasks }` |
| `POST /:id/tasks/generate` | `{ tasks, status }` |
| `DELETE /:id/tasks/completed` | `{ completedTasks }` |

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

Step 3: Auto-generate care tasks
  POST /api/v1/plants/:id/tasks/generate
  → { tasks, status }

Step 4: Quick actions (as needed)
  PATCH /api/v1/plants/:id/water         # log watering
  POST  /api/v1/plants/:id/fertilize     # log fertilizing
  PATCH /api/v1/plants/:id/light         # adjust light

Step 5: Complete tasks
  PATCH /api/v1/plants/:id/tasks/complete  { taskId }

Step 6: Get AI recommendations
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
