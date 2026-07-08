# API Workflows & Route Sequences

> **Purpose:** This document maps how TerraVision API routes connect in real-world user journeys. Each workflow shows the exact HTTP sequence, data flow between steps, and which fields are mandatory vs optional.

---

## Reference: Response Envelope

All endpoints return:

```json
// Success
{ "success": true, "message": "...", "data": {...}, "status": 200 }

// Error
{ "success": false, "message": "...", "status": 4xx, "details?": [...] }
```

**Auth header:** `Authorization: Bearer <accessToken>` (required on all endpoints except signup, login, refresh, and email verify).

---

## Common Prerequisites

| Step | Action | Endpoint |
|------|--------|----------|
| 1 | Sign up | `POST /api/v1/auth/signup` |
| 2 | Log in | `POST /api/v1/auth/login` |
| 3 | (optional) Refresh token | `POST /api/v1/auth/refresh` |

All workflows below assume the user has completed login and has a valid `accessToken`.

---

## Workflow 1: Plant Onboarding with AI (Recommended)

**The recommended end-to-end flow** for adding a new plant. Uses AI image analysis to pre-fill plant data and assigns the uploaded photo as the plant's cover image.

### Sequence

```
Step 1: Upload photo to S3 → get pre-signed PUT URL + S3 key
Step 2: Upload image binary directly to S3 (client-side)
Step 3: Extract plant data from the uploaded image via Gemini LLM
Step 4: Create plant using extracted data (override as needed) + set coverImage
Step 5: (optional) View the created plant with auto-generated cover image URL
```

### Step-by-Step

#### Step 1 — Get Pre-Signed Upload URL

```http
POST /api/v1/plants/user/image/upload
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "fileName": "tomato_leaf.jpg",
  "fileType": "image/jpeg"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://gateway.storjshare.io/plant/users/{userUuid}/images/1740000000-tomato_leaf.jpg?...signed...",
    "key": "users/{userUuid}/images/1740000000-tomato_leaf.jpg",
    "expiresIn": 300
  }
}
```

**→ Save the `key` field** — it will be used in Steps 3 and 4.

#### Step 2 — Upload Image to S3 (Client-Side)

```http
PUT <uploadUrl>
Content-Type: image/jpeg

<binary image data>
```

**Note:** This is a direct S3 PUT request from the client. The image never passes through the API server. The `uploadUrl` expires in 300 seconds.

**Response:** `200 OK` (no body).

#### Step 3 — Extract Plant Data from Image

```http
POST /api/v1/plants/image/extract
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "key": "users/{userUuid}/images/1740000000-tomato_leaf.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "Tomato",
    "category": "crop",
    "family": "fruiting_nightshade",
    "growthStage": "vegetative",
    "hasDisease": true,
    "soil": { "type": null, "moisture": null },
    "stress": {
      "diseaseType": "fungal",
      "severity": "medium"
    }
  }
}
```

**→ These are the extracted initial values.** You can use them as-is, override them, or cherry-pick fields in the next step.

#### Step 4 — Create Plant (with extracted data + coverImage)

```http
POST /api/v1/plants
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "name": "Tomato Plant 1",
  "commonName": "Roma Tomato",
  "category": "crop",
  "family": "fruiting_nightshade",
  "plantedAt": "2026-03-15T00:00:00Z",
  "growthStage": "flowering",
  "soil": {
    "type": "sandy",
    "moisture": 60
  },
  "watering": {
    "hoursSinceLastWatering": 5
  },
  "stress": {
    "diseaseType": "fungal",
    "severity": "medium"
  },
  "coverImage": "users/{userUuid}/images/1740000000-tomato_leaf.jpg"
}
```

**Field origin map:**

| Request Field | Source | Notes |
|--------------|--------|-------|
| `name` | **User input** (or extracted) | From extract or your own name |
| `commonName` | **User input** | Not provided by extract |
| `category` | **Extracted** (`"crop"`) | Can override |
| `family` | **Extracted** (`"fruiting_nightshade"`) | Can override |
| `plantedAt` | **User input** | Date you planted it |
| `growthStage` | **Extracted** (`"vegetative"`) | Overridden to `"flowering"` in example |
| `soil.type` | **User input** | Extract returns `null` |
| `soil.moisture` | **User input** | Extract returns `null` |
| `watering.hoursSinceLastWatering` | **User input** | Optional field |
| `stress.*` | **Extracted** | Optional — triggers `hasDisease` auto-compute |
| `coverImage` | **From Step 1** (`key`) | Sets the uploaded photo as cover |

**Response (201):**
```json
{
  "success": true,
  "message": "Plant created successfully",
  "data": {
    "uuid": "660e8400-e29b-41d4-a716-446655440001",
    "name": "Tomato Plant 1",
    "category": "crop",
    "family": "fruiting_nightshade",
    "growthStage": "flowering",
    "coverImage": "users/{userUuid}/images/1740000000-tomato_leaf.jpg"
  },
  "status": 201
}
```

#### Step 5 — View Plant (cover image auto-resolved)

```http
GET /api/v1/plants/660e8400-e29b-41d4-a716-446655440001
Authorization: Bearer <accessToken>
```

**Response includes `coverImageUrl` (pre-signed GET URL):**
```json
{
  "success": true,
  "data": {
    "uuid": "660e8400-e29b-41d4-a716-446655440001",
    "coverImage": "users/{userUuid}/images/1740000000-tomato_leaf.jpg",
    "coverImageUrl": "https://gateway.storjshare.io/plant/users/{userUuid}/images/1740000000-tomato_leaf.jpg?...signed..."
  }
}
```

### Diagram

```
User Device                 Express API                    Storj S3              Gemini LLM
    │                            │                            │                      │
    ├── POST /user/image/upload ─►│                            │                      │
    │◄─── { uploadUrl, key } ─────┤                            │                      │
    │                            │                            │                      │
    ├── PUT <uploadUrl> ──────────┼──────────────────────────►│                      │
    │◄──────── 200 OK ────────────┼────────────────────────────┤                      │
    │                            │                            │                      │
    ├── POST /image/extract ─────►│                            │                      │
    │                            ├── getObjectBuffer(key) ────►│                      │
    │                            │◄─────── buffer ─────────────┤                      │
    │                            ├─────────────────────────────────────────────────►│
    │◄── { name, category, ... }─┤                            │                      │
    │                            │                            │                      │
    ├── POST /plants ────────────►│                            │                      │
    │   { coverImage: key, ... }  │                            │                      │
    │◄─── { uuid, coverImage } ───┤                            │                      │
```

### Key Data Flow

```
Step 1 key ──┬──→ Step 3 extract(key) ──→ extracted values (name, category, family, etc.)
              │
              └──→ Step 4 create.coverImage = key
```

---

## Workflow 2: Quick Disease Scan (No Plant Required)

**Use case:** Scout a plant in the wild or a friend's garden — detect disease without creating a plant record.

### Sequence

```
Step 1: Upload image → get pre-signed URL + key
Step 2: Upload binary to S3
Step 3: Detect disease → get result (no persistence)
```

### Step-by-Step

#### Step 1 — Upload User Image

```http
POST /api/v1/plants/user/image/upload
Authorization: Bearer <accessToken>
{ "fileName": "wild_leaf.jpg", "fileType": "image/jpeg" }
```

**→ Save `key`** for step 3.

#### Step 2 — Upload to S3 (Client-Side)

```http
PUT <uploadUrl>
Content-Type: image/jpeg
```

#### Step 3 — Quick Disease Detection

```http
POST /api/v1/plants/user/image/detect
Authorization: Bearer <accessToken>
{ "key": "users/{userUuid}/images/1740000000-wild_leaf.jpg" }
```

**Response:**
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

**No plant is created.** This is a pure scan-and-return operation. If the ML service is down, defaults to `{ disease: "healthy", confidence: 1 }`.

---

## Workflow 3: Plant Disease Detection & Treatment

**Use case:** Detect disease on an existing plant's image and optionally treat it.

### Sequence

```
Step 1: Upload plant-specific image → get key
Step 2: Upload binary to S3 (client-side)
Step 3: Detect & persist disease on the plant
Step 4: (optional) If diseased → treat it
Step 5: (optional) Re-analyze to verify health
```

### Step-by-Step

#### Step 1 — Upload Plant Image

```http
POST /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/image/upload
Authorization: Bearer <accessToken>
{ "fileName": "tomato_leaf.jpg", "fileType": "image/jpeg" }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://.../plants/{userId}/{plantId}/images/1740000000-tomato_leaf.jpg?...",
    "key": "plants/{userId}/{plantId}/images/1740000000-tomato_leaf.jpg",
    "expiresIn": 300
  }
}
```

**Key pattern:** `plants/{userId}/{plantId}/images/{timestamp}-{fileName}` (scoped to the plant).

#### Step 2 — Upload to S3 (Client-Side)

```http
PUT <uploadUrl>
Content-Type: image/jpeg
```

#### Step 3 — Detect Disease (Persisted)

```http
PUT /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/detect
Authorization: Bearer <accessToken>
{ "key": "plants/{userId}/{plantId}/images/1740000000-tomato_leaf.jpg" }
```

**Response:**
```json
{
  "success": true,
  "message": "Disease detection completed",
  "data": {
    "disease": { "name": "early blight", "confidence": 0.94, "detectedAt": "..." },
    "diseaseHistory": [
      { "name": "early blight", "confidence": 0.94, "detectedAt": "..." }
    ],
    "model": { "name": "cnn_ensemble", "version": "1.0" }
  }
}
```

The plant's `disease` and `diseaseHistory` are now updated in the database.

#### Step 4 — (Optional) Treat Disease

```http
PATCH /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/treat-disease
Authorization: Bearer <accessToken>
```

Resets `disease.name` → `"healthy"`, `stress.diseaseType` → `"none"`, `stress.severity` → `"healthy"`.

**Response:**
```json
{
  "success": true,
  "message": "Disease treated",
  "data": { "status": {...}, "aiInsights": {...}, "activeTasks": [] }
}
```

#### Step 5 — (Optional) Re-Analyze

```http
POST /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/analyze
Authorization: Bearer <accessToken>
```

---

## Workflow 4: Full Plant Care Lifecycle

**Use case:** Analyze an existing plant, perform care actions, and track tasks. AI insights are available independently (see Workflow 5).

### Sequence

```
Step 1: Analyze plant → triggers 131-rule engine, creates care state
Step 2: View care state → see scores & status
Step 3: Perform care actions (each auto-completes matching tasks, re-runs analysis)
Step 4: View tasks → pending, overdue, prioritized
```

### Step-by-Step

#### Step 0 — Prerequisite: A Plant Exists

You need a plant UUID from:
- `POST /api/v1/plants` (Workflow 1)
- `GET /api/v1/plants` (list all)

#### Step 1 — Analyze Plant

```http
POST /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/analyze
Authorization: Bearer <accessToken>
```

Triggers the 7-layer, 131-rule engine. Creates (or updates) the plant's care state document. Fetches weather data if the user has a location set (non-fatal if missing).

**Response:**
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

#### Step 2 — View Care State

```http
GET /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/care-state
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "plantUUID": "660e8400-...",
    "status": { "water": "low", "nutrients": "optimal", "health": "healthy", "light": "low" },
    "engineScores": { "waterScore": 1.8, "fertilizerScore": 1.2, "pestRiskScore": 0.8, "lightScore": 1.5 },
    "activeTasks": [],
    "aiInsights": { "summary": "...", "recommendations": ["..."] }
  }
}
```

#### Step 3 — Perform Care Actions

All 6 care actions share the same pipeline:
1. Verify plant access
2. Apply entity delta (e.g., `plant.applyWatering(0)`)
3. Persist to DB
4. Complete matching task
5. Log the action
6. Re-analyze (run engine → save care state)
7. Auto-generate new tasks if status is not fully optimal
8. Generate AI insights (stored in care state)

```http
PATCH /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/water
```
_No request body needed for water, fertilize, harvest, treat-disease, or prune._

```http
PATCH /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/fertilize
```

```http
PATCH /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/prune
```

```http
PATCH /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/harvest
```
_Sets `growthStage` to `"mature"`._

```http
PATCH /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/light
{ "lightCondition": "partial_shade" }
```

```http
PATCH /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/treat-disease
```

**Typical response (all actions):**
```json
{
  "success": true,
  "message": "Plant watered",
  "data": {
    "status": { "water": "satisfied", "nutrients": "optimal", "health": "healthy", "light": "optimal" },
    "aiInsights": { "summary": "...", "recommendations": ["..."] },
    "activeTasks": []
  }
}
```

#### Step 4 — View Tasks

```http
# All active tasks (paginated)
GET /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/tasks?page=1&limit=20

# Overdue tasks only
GET /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/tasks/overdue

# Pending tasks only
GET /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/tasks/pending

# Prioritized (high → medium → low)
GET /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/tasks/prioritized
```

**Response (all task endpoints return unwrapped array):**
```json
{
  "success": true,
  "data": [
    {
      "taskId": "abc-123",
      "type": "watering",
      "priority": "high",
      "status": "pending",
      "dueDate": "2026-03-16T00:00:00Z",
      "description": "Water the plant"
    }
  ]
}
```

### Care Action Reference

| Action | Method | Path | Body | Entity Delta | Task Type |
|--------|--------|------|------|-------------|-----------|
| Water | `PATCH` | `/:id/water` | — | `hoursSinceLastWatering: 0` | `watering` |
| Fertilize | `PATCH` | `/:id/fertilize` | — | `soil.lastFertilized: now()` | `fertilizing` |
| Prune | `PATCH` | `/:id/prune` | — | `soil.lastPruned: now()` | `pruning` |
| Harvest | `PATCH` | `/:id/harvest` | — | `growthStage: "mature"` | `harvest` |
| Treat Disease | `PATCH` | `/:id/treat-disease` | — | Resets disease to healthy | `disease_treatment` |
| Change Light | `PATCH` | `/:id/light` | `{ lightCondition }` | No-op (weather-driven) | `move_light` |

### View Action Logs

```http
# Last 5 logs
GET /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/logs?last=5

# Filter by type
GET /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/logs?type=watered

# Paginated
GET /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/logs?page=1&limit=20
```

---

## Workflow 5: AI Insights (Standalone)

**Use case:** Generate or ask AI about a plant independently — not tied to a care action. Requires at least one prior `POST /:id/analyze` (so a care state exists).

### Generate AI Insights

```http
POST /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/ai-insights
Authorization: Bearer <accessToken>
```

**No request body.** Fetches care state + last 100 action logs → sends to Gemini → returns insights.

**Response:**
```json
{
  "success": true,
  "message": "AI insights generated",
  "data": {
    "summary": "Your tomato plant is in vegetative stage with adequate water...",
    "recommendations": [
      "Increase light exposure to 6+ hours daily",
      "Maintain current watering schedule"
    ]
  }
}
```

### Ask a Question

```http
POST /api/v1/plants/660e8400-e29b-41d4-a716-446655440001/ai-insights/ask
Authorization: Bearer <accessToken>
{ "question": "Should I move my tomato plant to more sunlight?" }
```

**Response:**
```json
{
  "success": true,
  "message": "Question answered",
  "data": {
    "answer": "Based on your plant's light score of 1.5 and current vegetative stage, moving it to partial sunlight for 4-6 hours daily would improve growth..."
  }
}
```

**Note:** A care state must exist (plant must have been analyzed at least once). Both endpoints return 404 if no care state is found.

---

## Workflow 6: Dashboard & Monitoring

**Use case:** Get a holistic view of all your plants, their health, weather, and activity.

### Quick Reference

| Endpoint | Purpose |
|----------|---------|
| `GET /api/v1/dashboard/` | Full aggregated dashboard (all sections) |
| `GET /api/v1/dashboard/stats` | Plant counts by category & growth stage |
| `GET /api/v1/dashboard/care` | Care status distribution & health % |
| `GET /api/v1/dashboard/resource-demand` | Counts of plants needing immediate attention |
| `GET /api/v1/dashboard/task-efficiency` | Active vs completed task metrics |
| `GET /api/v1/dashboard/harvests?limit=3` | Upcoming harvest dates |
| `GET /api/v1/dashboard/weather` | Current weather + UV index for user's location |
| `GET /api/v1/dashboard/ai-report` | AI-generated executive farm report |
| `GET /api/v1/dashboard/activity?last=10` | Most recent action logs |

All require `Authorization: Bearer <accessToken>`.

### Typical Usage Flow

```
1. GET /api/v1/dashboard/          → full overview (includes all sub-sections)
2. GET /api/v1/dashboard/weather   → check current conditions
3. GET /api/v1/dashboard/harvests  → see what's ready soon
4. GET /api/v1/dashboard/ai-report → get AI recommendations for the whole farm
5. GET /api/v1/dashboard/activity  → see recent changes
```

---

## Workflow 7: Auth & Account Lifecycle

**Use case:** Complete user account management — registration through deletion.

### Sequence

```
Step 1: Sign up → get user + tokens
Step 2: Verify email (optional)
Step 3: Log in → get tokens
Step 4: Refresh tokens when expired
Step 5: Change password (optional)
Step 6: View / update profile
Step 7: Log out
Step 8: (admin only) Delete account
```

### Step-by-Step

#### Step 1 — Sign Up

```http
POST /api/v1/auth/signup
{
  "name": "Farmer Joe",
  "email": "joe@farm.com",
  "password": "Secure123!",
  "location": { "city": "Nairobi" }
}
```

**Response (201):** `{ user: { uuid, name, email, role }, tokens: { accessToken, refreshToken } }`

#### Step 2 — Verify Email (Optional)

```http
# Send verification email
POST /api/v1/users/email
Authorization: Bearer <accessToken>

# Check verification status
GET /api/v1/users/email
Authorization: Bearer <accessToken>

# Verify via link (public — token from email)
GET /api/v1/users/email/verify?token=<hexToken>
```

#### Step 3 — Log In

```http
POST /api/v1/auth/login
{ "email": "joe@farm.com", "password": "Secure123!" }
```

**Response (200):** `{ user: { uuid, name, email, role, isVerified, location }, tokens: { accessToken, refreshToken } }`

#### Step 4 — Refresh Tokens

Call when the access token expires (receiving 401 responses):

```http
POST /api/v1/auth/refresh
{ "refreshToken": "<refreshToken>" }
```

**Response (200):** `{ accessToken: "<new>", refreshToken: "<new>" }`

**Note:** The old refresh token is invalidated on each refresh.

#### Step 5 — Change Password

```http
POST /api/v1/auth/change-password
Authorization: Bearer <accessToken>
{ "currentPassword": "Secure123!", "newPassword": "NewSecure456!" }
```

**Response (200):** Clears stored refresh token — forces re-login on all devices.

#### Step 6 — View / Update Profile

```http
# View
GET /api/v1/users/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <accessToken>

# Update
PUT /api/v1/users/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <accessToken>
{ "name": "Farmer Joe Updated", "location": { "city": "Nakuru" } }
```

#### Step 7 — Log Out

```http
POST /api/v1/auth/logout
Authorization: Bearer <accessToken>
```

Clears the stored refresh token, terminating the session.

#### Step 8 — Delete Account (Admin Only)

```http
DELETE /api/v1/users/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <accessToken>  # Must be admin
```

---

## Workflow 8: Admin Operations

**Use case:** Admin-level access across user boundaries.

### Prerequisites

User must have `role: "admin"` in their JWT.

| Action | Endpoint | Notes |
|--------|----------|-------|
| View any user | `GET /api/v1/users/:uuid` | Self-or-admin gate |
| View any plant | `GET /api/v1/plants/:id` | `verifyPlantAccess` allows admins |
| Delete user | `DELETE /api/v1/users/:uuid` | Admin only |
| Delete plant | `DELETE /api/v1/plants/:id` | `verifyPlantAccess` allows admins |

### Delete Plant (Admin)

```http
DELETE /api/v1/plants/660e8400-e29b-41d4-a716-446655440001
Authorization: Bearer <accessToken>  # Admin user
```

**Flow:**
1. `verifyPlantAccess` — admin bypass allowed
2. Delete all S3 images in parallel
3. Log `plant_deleted`
4. Delete action logs
5. Delete care state
6. Delete plant record

---

## Appendices

### Appendix A: Route Reference Table

All routes cross-referenced with which workflows use them.

| # | Method | Path | Auth | Module | Workflows | Notes |
|---|--------|------|------|--------|-----------|-------|
| 1 | `GET` | `/` | No | Health | — | `"Server is running"` |
| 2 | `POST` | `/api/v1/auth/signup` | No | Auth | 7.1 | |
| 3 | `POST` | `/api/v1/auth/login` | No | Auth | 1.0, 7.3 | |
| 4 | `POST` | `/api/v1/auth/refresh` | No | Auth | 7.4 | |
| 5 | `POST` | `/api/v1/auth/logout` | Yes | Auth | 7.7 | |
| 6 | `POST` | `/api/v1/auth/change-password` | Yes | Auth | 7.5 | |
| 7 | `POST` | `/api/v1/users/email` | Yes | User | 7.2 | Send verification email |
| 8 | `GET` | `/api/v1/users/email` | Yes | User | 7.2 | Check verification status |
| 9 | `GET` | `/api/v1/users/email/verify` | No | User | 7.2 | Public, query `?token=` |
| 10 | `GET` | `/api/v1/users/:id` | Yes | User | 7.6, 8 | Self-or-admin gate |
| 11 | `PUT` | `/api/v1/users/:id` | Yes | User | 7.6 | Self-or-admin gate |
| 12 | `DELETE` | `/api/v1/users/:id` | Yes | User | 7.8, 8 | Admin only |
| 13 | `POST` | `/api/v1/plants/user/image/upload` | Yes | Plant | 1.1, 2.1 | User-scoped S3 upload |
| 14 | `POST` | `/api/v1/plants/user/image/detect` | Yes | Plant | 2.3 | Quick disease scan |
| 15 | `POST` | `/api/v1/plants/image/extract` | Yes | Plant | 1.3 | LLM data extraction |
| 16 | `GET` | `/api/v1/plants` | Yes | Plant | 4.0 | List user's plants |
| 17 | `POST` | `/api/v1/plants` | Yes | Plant | 1.4 | Create plant |
| 18 | `GET` | `/api/v1/plants/:id` | Yes | Plant | 1.5, 8 | Get plant + coverImageUrl |
| 19 | `GET` | `/api/v1/plants/:id/image/:imageName` | Yes | Plant | — | Pre-signed GET for image |
| 20 | `PUT` | `/api/v1/plants/:id` | Yes | Plant | — | Partial update |
| 21 | `DELETE` | `/api/v1/plants/:id` | Yes | Plant | 8 | Delete plant |
| 22 | `POST` | `/api/v1/plants/:id/image/upload` | Yes | Plant | 3.1 | Plant-scoped S3 upload |
| 23 | `PUT` | `/api/v1/plants/:id/detect` | Yes | Plant | 3.3 | Disease detection (persisted) |
| 24 | `DELETE` | `/api/v1/plants/:id/images` | Yes | Plant | — | Remove image |
| 25 | `POST` | `/api/v1/plants/:id/analyze` | Yes | Plant Care | 4.1, 3.5 | Run rule engine |
| 26 | `GET` | `/api/v1/plants/:id/care-state` | Yes | Plant Care | 4.2 | View care state |
| 27 | `GET` | `/api/v1/plants/:id/logs` | Yes | Plant Care | 4.4 | View action logs |
| 28 | `POST` | `/api/v1/plants/:id/logs` | Yes | Plant Care | — | Add manual log |
| 29 | `DELETE` | `/api/v1/plants/:id/logs` | Yes | Plant Care | — | Clear old logs |
| 30 | `PATCH` | `/api/v1/plants/:id/water` | Yes | Plant Care | 4.3 | Water action |
| 31 | `PATCH` | `/api/v1/plants/:id/fertilize` | Yes | Plant Care | 4.3 | Fertilize action |
| 32 | `PATCH` | `/api/v1/plants/:id/harvest` | Yes | Plant Care | 4.3 | Harvest action |
| 33 | `PATCH` | `/api/v1/plants/:id/light` | Yes | Plant Care | 4.3 | Light action |
| 34 | `PATCH` | `/api/v1/plants/:id/treat-disease` | Yes | Plant Care | 3.4, 4.3 | Treat disease action |
| 35 | `PATCH` | `/api/v1/plants/:id/prune` | Yes | Plant Care | 4.3 | Prune action |
| 36 | `GET` | `/api/v1/plants/:id/tasks` | Yes | Plant Care | 4.4 | List tasks |
| 37 | `GET` | `/api/v1/plants/:id/tasks/overdue` | Yes | Plant Care | 4.4 | Overdue tasks |
| 38 | `GET` | `/api/v1/plants/:id/tasks/pending` | Yes | Plant Care | 4.4 | Pending tasks |
| 39 | `GET` | `/api/v1/plants/:id/tasks/prioritized` | Yes | Plant Care | 4.4 | Prioritized tasks |
| 40 | `POST` | `/api/v1/plants/:id/ai-insights` | Yes | Plant Care | 5 | Generate AI insights |
| 41 | `POST` | `/api/v1/plants/:id/ai-insights/ask` | Yes | Plant Care | 5 | Ask AI question |
| 42 | `GET` | `/api/v1/dashboard/` | Yes | Dashboard | 6 | Full dashboard |
| 43 | `GET` | `/api/v1/dashboard/stats` | Yes | Dashboard | 6 | Plant statistics |
| 44 | `GET` | `/api/v1/dashboard/care` | Yes | Dashboard | 6 | Care distribution |
| 45 | `GET` | `/api/v1/dashboard/resource-demand` | Yes | Dashboard | 6 | Resource demand |
| 46 | `GET` | `/api/v1/dashboard/task-efficiency` | Yes | Dashboard | 6 | Task efficiency |
| 47 | `GET` | `/api/v1/dashboard/harvests` | Yes | Dashboard | 6 | Upcoming harvests |
| 48 | `GET` | `/api/v1/dashboard/ai-report` | Yes | Dashboard | 6 | AI farm report |
| 49 | `GET` | `/api/v1/dashboard/weather` | Yes | Dashboard | 6 | Weather + UV |
| 50 | `GET` | `/api/v1/dashboard/activity` | Yes | Dashboard | 6 | Recent activity |

### Appendix B: S3 Key Pattern Reference

| Pattern | Generated By | Used In | Example |
|---------|-------------|---------|---------|
| `users/{userId}/images/{timestamp}-{file}` | `POST /user/image/upload` | `POST /image/extract`, `POST /` (as `coverImage`), `POST /user/image/detect` | `users/abc123/images/1712345679-tomato.jpg` |
| `plants/{userId}/{plantId}/images/{timestamp}-{file}` | `POST /:id/image/upload` | `PUT /:id/detect`, `DELETE /:id/images` | `plants/abc123/plant456/images/1712345678-leaf.jpg` |

### Appendix C: Data Flow Diagram — Complete Plant Onboarding

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PLANT ONBOARDING DATA FLOW                    │
└─────────────────────────────────────────────────────────────────────┘

Step 1: POST /user/image/upload
┌──────────────┐
│  fileName    │──┐
│  fileType    │──┤
└──────────────┘  │
                  ▼
         ┌────────────────┐
         │  uploadUrl     │──→ Used by client for S3 PUT
         │  key ──────────┼──┐
         └────────────────┘  │
                             │
                             ▼
Step 3: POST /image/extract  │
┌──────────────┐             │
│  key ────────┼─────────────┘
└──────────────┘             │
                             ▼
                    ┌───────────────────────┐
                    │  name (extracted)     │──┐
                    │  category (extracted) │──┤
                    │  family (extracted)   │──┤
                    │  growthStage (ext)    │──┤
                    │  stress (extracted)   │──┤── Can override in Step 4
                    │  hasDisease (ext)     │──┤
                    │  soil (null)          │──┤
                    └───────────────────────┘  │
                                               ▼
Step 4: POST /plants                           │
┌─────────────────────────┐                    │
│  name (use or override) │◄───────────────────┘
│  category               │◄───────────────────┘
│  family                 │◄───────────────────┘
│  growthStage            │◄───────────────────┘
│  stress                 │◄───────────────────┘
│  plantedAt (user input) │
│  soil.type (user input) │
│  soil.moisture (input)  │
│  coverImage ────────────┼── Set to `key` from Step 1
└─────────────────────────┘
```
