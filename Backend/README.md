# TerraVision AI — Backend API

Enterprise-grade smart farming platform providing AI-powered plant disease detection, environmental analysis, and automated care recommendations through a rule-based scoring engine.

---

## Project Overview

### Business Context

Modern agriculture faces increasing challenges from climate variability, pests, and disease outbreaks. The Farming Assistant platform bridges the gap between traditional farming knowledge and data-driven agronomy by providing:

- **Real-time disease detection** via a custom CNN ensemble model (86 crop-disease classes)
- **Environmental analysis** integrating live weather data with plant-specific care rules
- **Automated care scoring** through a 131-rule engine covering watering, nutrients, pest risk, and light
- **AI-generated insights** powered by Google Gemini for actionable recommendations

### System Boundaries

```
User Devices (Web/Mobile)
        │
        ▼
┌───────────────────┐     ┌──────────────────┐
│  Express API      │────▶│  ML Microservice  │
│  (Backend)        │     │  (FastAPI + Keras)│
│  Port 5500        │     │  Port 8000        │
└───────┬───────────┘     └──────────────────┘
        │
        ├── MongoDB (terra_db) ──── User profiles, plants, care state
        ├── Storj S3 (Plant) ────── Plant images
        ├── OpenWeatherMap ──────── Live weather conditions
        └── Google Gemini API ───── AI insights & task generation
```

### Key Features

| Feature                 | Capability                                                  |
| ----------------------- | ----------------------------------------------------------- |
| Plant Disease Detection | 86-class CNN ensemble (1.04 GB model) via ML microservice   |
| Rule Engine Analysis    | 7 layers × 131 rules scoring water, fertilizer, pest, light |
| Real-time Weather       | OpenWeatherMap integration with location-based queries      |
| AI Plant Care           | Gemini-powered task generation, insights, Q&A               |
| Secure Storage          | Storj S3-compatible storage with pre-signed URLs            |
| JWT Auth                | Access + refresh token rotation with role-based access      |
| Email Verification      | Nodemailer-based email verification flow                    |

---

## Architecture Overview

### Architecture Style

**Modular Monolith** with an external ML microservice. The core backend uses **Use Cases** for business logic, **Entities** for domain state, and **Infrastructure** for external concerns — all wired through a dependency injection container. Disease detection is delegated to a separate Python FastAPI microservice.

### Request Lifecycle

```mermaid
sequenceDiagram
    participant Client
    participant Middleware
    participant Controller
    participant UseCase
    participant Entity
    participant Repository
    participant DB

    Client->>Middleware: HTTP Request + JWT
    Middleware->>Middleware: Verify Token / Attach req.user
    Middleware->>Controller: Forward Request
    Controller->>UseCase: Delegate Business Logic
    UseCase->>Entity: Load / Mutate Domain State
    Entity->>Repository: Data Access
    Repository->>DB: Query / Write
    DB-->>Repository: Result
    Repository-->>Entity: Domain Object
    Entity-->>UseCase: Updated State
    UseCase-->>Controller: Result DTO
    Controller-->>Client: JSON Response
    Middleware->>Middleware: Error Handling (if any)
```

### Service Communication

```mermaid
graph TD
    A[Express Server :5500] --> B[Auth Module]
    A --> C[User Module]
    A --> D[Plant Module]
    A --> E[Plant Care Module]
    D --> F[S3 Cloud Service]
    D --> G[Plant Use Cases]
    G --> H[Plant Entity]
    H --> I[Plant Repo]
    D --> J[Disease Detection Use Case]
    J --> K[ML Microservice :8000]
    E --> L[Plant Care Use Cases]
    L --> M[Plant Care Entity]
    M --> N[Plant Care Repo]
    M --> O[Action Log Repo]
    E --> P[Weather Service]
    E --> Q[LLM Service]
    E --> R[Rule Engine]
    P --> S[OpenWeatherMap API]
    Q --> T[Google Gemini API]
    F --> U[Storj S3 Bucket]
```

### Module Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                           Express App                            │
├──────────┬──────────┬───────────┬──────────────────┬──────────────┤
│   Auth    │   User   │   Plant   │   Plant Care     │  Dashboard   │
│  Module   │  Module  │  Module   │    Module        │   Module     │
├──────────┴──────────┴───────────┴──────────────────┴──────────────┤
│                           Use Case Layer                          │
├──────────┬──────────┬───────────┬──────────────────┬──────────────┤
│   Auth    │   User   │   Plant   │   Plant Care     │  Dashboard   │
│ Use Case │ Use Case │ Use Case  │   Use Cases       │   Use Case   │
├──────────┴──────────┴───────────┴──────────────────┴──────────────┤
│                           Entity Layer                            │
├──────────────────┬────────────────────────────────────────────────┤
│   User Entity    │                  Plant Entity                  │
├──────────────────┴────────────────────────────────────────────────┤
│                       Engine (131 Rules)                          │
│  global │ soil │ plantFamily │ growthStage │                      │
│  watering │ pestDisease │ light                                   │
├──────────────────┬────────────────────────────────────────────────┤
│                    Infrastructure Layer                            │
├──────────┬──────────┬───────────┬──────────────────┬──────────────┤
│  User    │  Plant   │PlantCare  │   Action Log     │              │
│  Repo    │  Repo    │  Repo     │   Repo            │              │
├──────────┴──────────┴───────────┴──────────────────┴──────────────┤
│  Token   │  Pass    │  S3       │   LLM            │              │
│  Service │  Hasher  │  Cloud    │   Service         │              │
├──────────┴──────────┴───────────┴──────────────────┴──────────────┤
│                    MongoDB (terra_db)                              │
│   users │ plants │ plantcares │ actionlogs                        │
└───────────────────────────────────────────────────────────────────┘
```

---

## System Design Principles

### Scalability

- **Stateless API** — Authentication state is stored in the client (JWT); no server-side session storage
- **Horizontal scaling** — All application state is in MongoDB; adding more Express instances requires no reconfiguration
- **Pre-signed S3 URLs** — Image uploads bypass the API server entirely, eliminating file transfer bottlenecks
- **Separate ML service** — The CNN model runs in its own process, preventing Python ML latency from blocking Node.js request handling

### Reliability

- **Repository pattern** — Data access is abstracted behind interfaces; swapping databases requires no service-layer changes
- **Validation at boundaries** — Zod schemas validate all DTOs at the controller/middleware level before business logic runs
- **Error classification** — `RouteError` provides typed operational errors with appropriate HTTP status codes; unknown errors are caught by the global error handler and logged without leaking internals

### Security

- **JWT with short-lived access tokens** (15 min) and rotating refresh tokens (7 days)
- **bcrypt password hashing** (12 salt rounds) — no plaintext passwords ever stored or transmitted
- **Role-based authorization** (`user` / `admin`) enforced at the middleware level
- **Plant access verification** — Every plant-scoped endpoint verifies that `req.user.uuid` owns the plant UUID
- **S3 signed URLs** — Direct upload/download without exposing bucket credentials to clients

### Observability

- **Structured error logging** — All errors pass through `error.middleware.js` which logs timestamp, request path, method, and error details
- **Engine audit trail** — Every rule evaluation records which rules were applied (`_appliedRules`), enabling full traceability of score computation

---

## Tech Stack

### Runtime & Framework

| Technology     | Version | Purpose                  |
| -------------- | ------- | ------------------------ |
| Node.js        | ≥20.x   | JavaScript runtime       |
| Express        | 5.x     | HTTP framework           |
| Mongoose       | 9.x     | MongoDB ODM              |
| JSON Web Token | 9.x     | Stateless authentication |

### Data Layer

| Technology            | Purpose                            |
| --------------------- | ---------------------------------- |
| MongoDB               | Primary database (document store)  |
| Storj (S3-compatible) | Image storage with pre-signed URLs |

### External Services

| Service                  | Integration      | Purpose                       |
| ------------------------ | ---------------- | ----------------------------- |
| OpenWeatherMap           | REST API (axios) | Real-time weather data        |
| Google Gemini            | REST API         | AI insights & task generation |
| ML Microservice (Python) | HTTP (FastAPI)   | CNN disease detection         |
| Nodemailer               | SMTP             | Email verification            |

### Infrastructure

| Component        | Details              |
| ---------------- | -------------------- |
| Containerization | Not yet configurable |
| Orchestration    | Not yet configured   |
| CI/CD            | Not yet configured   |

### Testing

| Tool             | Purpose                                                    |
| ---------------- | ---------------------------------------------------------- |
| Node.js `assert` | Unit & integration tests (~120 test cases across 12 files) |

---

## Folder Structure

````
Backend/
├── app.js                 Express 5 entrypoint, middleware stack, route mounting
├── config/                config.js + config.env
│
├── routes/                5 route files
│   ├── auth.route.js
│   ├── dashboard.route.js
│   ├── user.route.js
│   ├── plant.route.js
│   └── plant-care.route.js
│
├── controller/            5 controllers — parse input, call use case, format response
│   ├── auth.controller.js
│   ├── dashboard.controller.js
│   ├── user.controller.js
│   ├── plant.controller.js
│   └── plant-care.controller.js
│
├── usecases/              8 use case files — all business logic, own dependencies
│   ├── auth.usecases.js
│   ├── dashboard.usecase.js
│   ├── user.usecases.js
│   ├── plant.usecase.js
│   ├── disease-detection.usecase.js
│   ├── plant-analyser.usecase.js
│   ├── plant-care-action.usecase.js
│   └── plant-care.usecase.js
│
├── entity/                2 entities (User, Plant) — private #data, delta-returning methods
│   ├── User.entity.js
│   └── Plant.entity.js
│
├── service/               plant.service.js (verifyPlantAccess), dashboard.service.js (aggregation), email, weather, engine/ (7 layers), vision
│   ├── plant.service.js
│   ├── dashboard.service.js
│   ├── email.service.js
│   ├── weather.service.js
│   ├── vision.service.js
│   └── engine/
│       ├── index.js
│       ├── engine.js
│       ├── global.js
│       ├── soil.js
│       ├── plantFamilies.js
│       ├── growthStages.js
│       ├── watering.js
│       ├── pestDisease.js
│       └── light.js
│
├── infrastructure/
│   ├── repo/              5 repos — pure CRUD, return entities
│   │   ├── user.repository.js
│   │   ├── plant.repository.js
│   │   ├── plant-care.repository.js
│   │   ├── s3Cloud.repository.js
│   │   └── action-log.repository.js
│   └── service/           token, password hasher, S3 cloud, LLM
│       ├── token.service.js
│       ├── passHash.service.js
│       ├── s3Cloud.service.js
│       └── llm.service.js
│
├── model/                  4 Mongoose schemas + enums
│   ├── user.model.js
│   ├── plant.model.js
│   ├── plant-care.model.js
│   └── action-log.model.js
│
├── dto/                    Zod schemas (PlantDTO, UserDTO)
│   ├── user.dto.js
│   └── plant.dto.js
│
├── middlewares/            auth (JWT), error handler, emailValidator
│   ├── auth.middleware.js
│   ├── error.middleware.js
│   └── emailValidator.middleware.js
│
├── shared/                 container.js (DI), db.js, s3Client, rules/ (7 JSON), util/
│   ├── container.js
│   ├── db.js
│   ├── s3Client.cloud.js
│   ├── rules/
│   └── util/
│
└── test/
    ├── service/            8 use case test files
    │   ├── auth.test.js
    │   ├── dashboard.usecase.test.js
    │   ├── user.test.js
    │   ├── plant.test.js
    │   ├── disease-detection.test.js
    │   ├── engine.test.js
    │   ├── plant-care-state.test.js
    │   └── plant-care-ai-insights.test.js
    └── routes/
        ├── helpers/
        ├── route-auth.test.js
        ├── route-plant.test.js
        ├── route-plant-care.test.js
        └── route-user.test.js
    ```

    ```
    Ml-service/
├── app/
│   ├── main.py                     # FastAPI application
│   ├── model.py                    # Keras CNN model (86 classes)
│   ├── config.py                   # Environment config
│   ├── util.py                     # Image preprocessing
│   ├── cloud.py                    # S3 cloud client
│   └── test.py                     # Local inference test
├── models/
│   └── plant.keras                 # Pre-trained CNN ensemble (~1.04 GB)
├── test_images/                    # Sample images for testing
└── requirement.txt                 # Python dependencies
````

---

## Environment Variables

All environment variables are loaded from `Backend/config/config.env` via `dotenv`.

| Variable                   | Required | Description                      | Default                         |
| -------------------------- | -------- | -------------------------------- | ------------------------------- |
| `PORT`                     | Yes      | Express server port              | `5500`                          |
| `MongoURI`                 | Yes      | MongoDB connection string        | `mongodb://127.0.0.1:27017`     |
| `ACCESS_TOKEN_SECRET`      | Yes      | JWT access token signing secret  | —                               |
| `ACCESS_TOKEN_EXPIRES_IN`  | Yes      | Access token TTL                 | `15m`                           |
| `REFRESH_TOKEN_SECRET`     | Yes      | JWT refresh token signing secret | —                               |
| `REFRESH_TOKEN_EXPIRES_IN` | Yes      | Refresh token TTL                | `7d`                            |
| `WEATHER_API_KEY`          | Yes      | OpenWeatherMap API key           | —                               |
| `S3_REGION`                | Yes      | Storj S3 region                  | `eu-central-1`                  |
| `S3_BUCKET_NAME`           | Yes      | Storj bucket name                | `plant`                         |
| `S3_ENDPOINT`              | Yes      | Storj gateway endpoint           | `https://gateway.storjshare.io` |
| `S3_ACCESS_KEY_ID`         | Yes      | Storj access key                 | —                               |
| `S3_SECRET_ACCESS_KEY`     | Yes      | Storj secret key                 | —                               |
| `EMAIL_HOST`               | Yes      | SMTP host                        | `smpt.gmail.com`                |
| `EMAIL_PORT`               | Yes      | SMTP port                        | `587`                           |
| `EMAIL_USER`               | Yes      | SMTP login user                  | —                               |
| `EMAIL_PASS`               | Yes      | SMTP login password              | —                               |
| `EMAIL_FROM`               | Yes      | From address for outgoing email  | —                               |
| `DISEASE_DETECTION_URL`    | Yes      | ML microservice base URL         | `http://localhost:8000`         |
| `LLM_SERVICE_URL`          | Yes      | Google Gemini API endpoint       | —                               |
| `ApiKey`                   | Yes      | Google Gemini API key            | —                               |

> **Security note:** The `config.env` file is currently tracked in version control. For production deployments, use a secret manager (AWS Secrets Manager, HashiCorp Vault) or CI/CD-injected environment variables.

---

## Installation & Setup

### Prerequisites

- Node.js ≥20.x
- MongoDB ≥6.x (local or Atlas)
- Python ≥3.10 (for ML service)
- Storj or AWS S3 bucket credentials
- OpenWeatherMap API key
- Google Gemini API key

### Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/AH0Cs50/farming_assistant_collage.git
cd farming_assistant_collage/Backend

# 2. Install dependencies
npm install

# 3. Configure environment
cp config/config.env.example config/config.env   # Create if not exists
# Edit config.env with your API keys and secrets

# 4. Start MongoDB (if running locally)
mongod --dbpath /data/db

# 5. Start the server
node app.js
# Server starts at http://localhost:5500
```

### ML Service Setup

```bash
cd Ml-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirement.txt

# Configure environment
cp config.env.example config.env  # Edit with your S3 credentials

# Start the FastAPI server
uvicorn app.main:app --reload --port 8000
```

### Docker Setup (Manual)

Docker configuration is not yet available. To containerize:

```bash
# Backend Dockerfile (to be created)
FROM node:20-alpine
WORKDIR /app
COPY Backend/ .
RUN npm install --production
EXPOSE 5500
CMD ["node", "app.js"]

# Build and run
docker build -t farming-backend -f Backend/Dockerfile .
docker run -p 5500:5500 --env-file Backend/config/config.env farming-backend
```

---

## Running the System

### Development Mode

```bash
# Terminal 1: Backend
node --watch app.js                    # Hot reload via Node.js --watch flag

# Terminal 2: ML Service
uvicorn app.main:app --reload --port 8000

# Terminal 3: MongoDB (if local)
mongod
```

### Production Mode

```bash
NODE_ENV=production node app.js
```

### Running Tests

```bash
# Run individual test suite
node test/auth.test.js

# Run all test suites (when configured)
# for f in test/*.test.js; do node "$f"; done
```

---

## API Documentation

For complete API reference including all endpoints, request/response examples, enums,
and user experience flows, see [API.md](./API.md).

## Authentication & Authorization

### JWT Token Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant DB

    Client->>API: POST /auth/login { email, password }
    API->>API: Verify password (bcrypt)
    API->>API: Generate Access Token (15m) + Refresh Token (7d)
    API->>DB: Store refresh token hash
    API-->>Client: { accessToken, refreshToken, uuid }

    Client->>API: POST /plants (Authorization: Bearer accessToken)
    API->>API: verifyAccessToken()
    API->>API: Attach req.user { uuid, email, role }
    API-->>Client: Response

    Note over Client,API: When access token expires:

    Client->>API: POST /auth/refresh { refreshToken }
    API->>API: verifyRefreshToken()
    API->>DB: Compare stored token
    API->>API: Rotate: new access + refresh tokens
    API->>DB: Replace stored refresh token
    API-->>Client: { accessToken, refreshToken }
```

### Token Payload

```javascript
// Decoded JWT payload
{
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "email": "joe@farm.com",
  "role": "user",
  "iat": 1712345678,
  "exp": 1712346578
}
```

### Role-Based Access

| Role    | Permissions                                                 |
| ------- | ----------------------------------------------------------- |
| `user`  | Own plants CRUD, own profile, disease detection, plant care |
| `admin` | All user permissions + any-plant access, user management    |

Authorization is enforced via the `authorize(...roles)` middleware factory:

```javascript
// Only admin can delete users
router.delete("/:id", authenticate, authorize("admin"), deleteUser);
```

---

## Rule Engine (Scoring System)

### Architecture Overview

```mermaid
graph TD
    A[Plant UUID] --> B[PlantService.getEnginePlantInput]
    C[User UUID] --> D[UserService.getUserLocation]
    D --> E[WeatherService.getWeather]
    E --> F[WeatherDescriber]
    F --> G[Engine Input: { weather, plant }]
    B --> G
    G --> H[Engine.evaluate]
    H --> I[Layer 1: Global Rules]
    H --> J[Layer 2: Soil Modifiers]
    H --> K[Layer 3: Plant Family Rules]
    H --> L[Layer 4: Growth Stage Rules]
    H --> M[Layer 5: Watering History]
    H --> N[Layer 6: Pest/Disease Rules]
    H --> O[Layer 7: Light Modifiers]
    I --> P[Aggregate Scores]
    J --> P
    K --> P
    L --> P
    M --> P
    N --> P
    O --> P
    P --> Q[waterScore: 0.5-2.0]
    P --> R[fertilizerScore: 0.5-2.0]
    P --> R
    P --> S[pestRiskScore: 0.5-2.0]
    P --> T[lightScore: 0.5-2.0]
    Q --> U[Care State Mapping]
    R --> U
    S --> U
    T --> U
```

### How Rules Work

Each rule has three parts:

```json
{
  "id": "watering_drought_severe",
  "condition": {
    "plant.watering.hoursSinceLastWatering": { "gte": 120 }
  },
  "effects": {
    "waterScore": -0.4,
    "waterMultiplier": 0.85,
    "explanation": "Severe drought stress detected"
  }
}
```

1. **Condition** — Path-expression evaluation against the input `{ weather, plant }` object. Supports operators: `eq`, `gte`, `lte`, `gt`, `lt`, `neq`
2. **Effects** — Additive (delta) and multiplicative adjustments to four score dimensions
3. **Scoring** — Base score = 1.0. Additive adjustments applied first, then multiplicative. Final value clamped to [0.5, 2.0]

### Layer Execution Order

| Layer            | Rules | Evaluates                                               |
| ---------------- | ----- | ------------------------------------------------------- |
| Global           | 17    | Temperature, humidity, base weather conditions          |
| Soil             | 20    | Soil type, moisture level modifiers, recent fertilizing |
| Plant Family     | 38    | Per-family water sensitivity, nutrient demand           |
| Growth Stage     | 18    | Germination through mature stage modifiers              |
| Watering History | 7     | Hours-since-last-watering drought levels                |
| Pest/Disease     | 9     | Disease type × severity × weather interactions          |
| Light            | 22    | Cloud cover, time-of-day, family-specific light needs   |

### Score → Status Mapping

| Score Range | Water         | Nutrients    | Health     | Light       |
| ----------- | ------------- | ------------ | ---------- | ----------- |
| ≥ 1.7       | `thirsty`     | `excess`     | `critical` | `burn_risk` |
| 1.3 – 1.69  | `low`         | `optimal`    | `diseased` | `high`      |
| 0.8 – 1.29  | `satisfied`   | `low`        | `warning`  | `optimal`   |
| < 0.8       | `overwatered` | `needs_feed` | `healthy`  | `low`       |

---

## Disease Detection Pipeline

```mermaid
sequenceDiagram
    participant Client
    participant API as Express API
    participant S3 as Storj S3
    participant ML as ML Microservice

    Client->>API: POST /plants/:id/upload { fileName, fileType }
    API->>API: Generate signed PUT URL
    API-->>Client: { uploadUrl, key }
    Client->>S3: PUT <uploadUrl> (image binary)
    S3-->>Client: 200 OK

    Client->>API: POST /plants/:id/detect { key }
    API->>API: Verify plant access
    API->>ML: POST /predict { user_id, plant_id, key, expected_plant }
    ML->>S3: get_file_by_key(key)
    S3-->>ML: Image bytes
    ML->>ML: Preprocess (224×224, NEAREST resize, normalize)
    ML->>ML: CNN ensemble inference (weighted avg [0.2, 0.3, 0.5])
    ML-->>API: { prediction, top_k, confidence }
    API->>API: Update plant disease history
    API-->>Client: { prediction, disease info }
```

### CNN Model Details

- **Architecture:** 3-member ensemble CNN (EfficientNetV2B0, ResNet101V2, MobileNetV2)
- **Input size:** 224×224×3 (RGB, NEAREST interpolation, normalized to [0,1])
- **Ensemble weights:** `[0.2, 0.3, 0.5]` matching training
- **Classes:** 88 (crops × diseases + healthy classes)
- **Supported crops:** Apple, Cassava, Cherry, Chili, Coffee, Corn, Cucumber, Guava, Grape, Jamun, Lemon, Mango, Peach, Pepper (bell), Pomegranate, Potato, Rice, Soybean, Strawberry, Sugarcane, Tea, Tomato, Wheat
- **Disease classification:** Fungal, bacterial, viral, pest, physiological, healthy

> **Resilience:** When the ML microservice returns `success: false` or is unreachable, the disease detection service falls back to a safe `"healthy"` prediction with 1.0 confidence, ensuring the API never blocks on ML failures.

---

## Background Jobs & Queues

The current implementation processes all operations synchronously within the request-response cycle. The ML microservice is called synchronously over HTTP. No background job queue system has been implemented.

### Future Queue Architecture (Planned)

```mermaid
graph LR
    A[API Server] -->|Enqueue detection job| B[BullMQ / RabbitMQ]
    B --> C[Worker 1]
    B --> D[Worker 2]
    C --> E[ML Microservice]
    D --> E
    E --> F[Store Result]
    F --> G[WebSocket / Polling]
    G --> H[Client]
```

---

## Testing Strategy

### Test Organization

```
test/
├── auth.test.js                 # 6 tests: signup, login, refresh, logout
├── user.test.js                 # 11 tests: CRUD, findBy, token/email
├── plant.test.js                # 9 tests: CRUD, pagination, access control
├── s3Cloud.test.js              # 16 tests: MIME, paths, keys, signed URLs
├── disease-detection.test.js    # 7 tests: detect, history, error handling
├── weather.test.js              # 3 tests: city, coords, invalid input
├── token.test.js                # 7 tests: generate, verify, invalid token
├── engine.test.js               # 12 tests: all rule layers
├── plant-care-state.test.js     # ~15 tests: tasks, logs, manager
├── plant-care-ai-insights.test.js # ~15 tests: insights, Q&A
└── route-plant-care.test.js     # 18 tests: action pipeline, task views
```

### Running Tests

```bash
# Run a specific test suite
node test/auth.test.js

# Run all tests
for f in test/*.test.js; do node "$f"; done
```

### Test Pattern

All tests use Node.js built-in `assert` module with `async/await`:

```javascript
import assert from "node:assert";

async function testSignupSuccess() {
  try {
    const result = await authService.signup({
      name: "Test User",
      email: "test@example.com",
      password: "Test123!",
    });
    assert.ok(result.accessToken, "Should return access token");
    assert.ok(result.refreshToken, "Should return refresh token");
    console.log("✅ testSignupSuccess passed");
  } catch (error) {
    console.log("❌ testSignupSuccess failed:", error.message);
  }
}
```

---

## CI/CD Pipeline (Planned)

```yaml
# .github/workflows/ci.yml (to be created)
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx eslint Backend/

  test:
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo:7
        options: --health-cmd "mongosh --eval 'db.runCommand({ ping: 1 })'"
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: for f in test/*.test.js; do node "$f"; done
        working-directory: Backend
```

---

## Performance & Scalability Considerations

### Current Architecture

| Aspect       | Design                     | Limitation                             |
| ------------ | -------------------------- | -------------------------------------- |
| State        | Stateless (JWT)            | Good for horizontal scaling            |
| Image Upload | Direct-to-S3 (signed URLs) | No server bottleneck                   |
| ML Inference | Synchronous HTTP           | Blocks request if ML service is slow   |
| Database     | Single MongoDB instance    | No read replicas configured            |
| Caching      | None                       | Every weather call hits OpenWeatherMap |

### Optimization Roadmap

1. **Add caching layer** — Cache weather data in Redis with TTL of 30 minutes (OpenWeatherMap data changes slowly)
2. **Async ML inference** — Queue detection jobs, return immediately with a job ID, allow polling
3. **Database indexing** — Ensure indexes on `uuid`, `userInternalId`, `plantUUID` for all collections
4. **Connection pooling** — Configure MongoDB driver `maxPoolSize` for concurrent requests
5. **Rate limiting** — Implement `express-rate-limit` on auth endpoints and ML service

---

## Error Handling

### Error Architecture

```javascript
// Custom operational error class
class RouteError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Distinguishes expected errors from bugs
    this.details = details; // Optional validation error details
  }
}

// Usage in services
throw new RouteError(HttpStatusCodes.NOT_FOUND, "Plant not found");
```

### Global Error Handler

```javascript
function errorHandler(err, req, res, next) {
  console.error(err);

  if (err instanceof RouteError) {
    const response = {
      success: false,
      message: err.message,
      status: err.statusCode,
    };
    if (err.details) {
      response.details = err.details;
    }
    return res
      .status(Number.isInteger(err.statusCode) ? err.statusCode : 500)
      .json(response);
  }

  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
    status: 500,
  });
}
```

### Response Sanitization

All API responses are automatically sanitized by the `HttpResponse` helper. Internal-only fields (`_id`, `__v`, `internalId`, `plantInternalId`, `userInternalId`, `password`) are stripped from every response. BSON ObjectIds are converted to strings, and Buffer types are excluded.

### Error Response Format

```json
{
  "success": false,
  "message": "Human-readable error description"
}
```

Common HTTP status codes used:

| Code | When                                                  |
| ---- | ----------------------------------------------------- |
| 400  | Validation failure, missing fields, invalid file type |
| 401  | Missing/invalid/expired JWT                           |
| 403  | Insufficient role permissions                         |
| 404  | Resource not found (plant, user, care state)          |
| 409  | Duplicate email during signup                         |
| 429  | Rate limit exceeded (future)                          |
| 500  | Unexpected internal errors                            |
| 503  | ML microservice or external API unavailable           |

---

## Logging & Monitoring

### Current Logging

- **Console logging** via `console.log`/`console.error` in development
- **Error middleware** logs unexpected (non-operational) errors with timestamp, request path, method, and stack trace
- **No structured logging library** (Pino, Winston) configured yet

### Recommended Production Setup

| Tool            | Purpose                              |
| --------------- | ------------------------------------ |
| Pino or Winston | Structured JSON logging              |
| PM2             | Process management with log rotation |
| Grafana + Loki  | Log aggregation and visualization    |
| Prometheus      | Metrics collection                   |
| Sentry          | Error tracking and alerting          |

---

## Database Documentation

### MongoDB Schema Design

```mermaid
erDiagram
    User ||--o{ Plant : owns
    Plant ||--o{ PlantCare : has
    Plant ||--o{ ActionLog : "tracks"
    User ||--o{ ActionLog : logs
    User {
        number internalId PK
        string uuid UK
        string name
        string email UK
        string password
        string role
        boolean isVerified
        string refreshToken
        string emailToken
        object location
    }
    Plant {
        number internalId PK
        string uuid UK
        number userInternalId FK
        string name
        string family
        string growthStage
        date plantedAt
        object soil
        object watering
        object stress
        array diseaseHistory
        object cdn
        number ageDays
        boolean hasDisease
    }
    PlantCare {
        number internalId PK
        string uuid UK
        string plantUUID FK
        object status
        object engineScores
        array activeTasks
        array completedTasks
        array actionLogs
        object aiInsights
    }
    ActionLog {
        number logId PK
        string plantUUID UK
        number plantInternalId
        string userUUID
        number userInternalId
        string actionType
        string description
        object metadata
        date createdAt
    }
```

> **Logger description:** All `plantCareActionLogger` calls require a description string (3rd argument) explaining the action — e.g., `logDiseaseDetected(plantUUID, user, "Disease detected", ...)`. This populates the `ActionLog.description` field and ensures every log entry is human-readable without inspecting metadata.

### Indexing Strategy

Recommended indexes (to be created if not present):

```javascript
// User collection
userSchema.index({ uuid: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ internalId: 1 }, { unique: true });

// Plant collection
plantSchema.index({ uuid: 1 }, { unique: true });
plantSchema.index({ userInternalId: 1 });
plantSchema.index({ "stress.severity": 1 });

// PlantCare collection
plantCareSchema.index({ uuid: 1 }, { unique: true });
plantCareSchema.index({ plantUUID: 1 });
plantCareSchema.index({ "status.health": 1 });
```

### Connection

```javascript
// shared/db.js — Database name: terra_db
const MONGO_URI = "mongodb://127.0.0.1:27017/terra_db";
await mongoose.connect(MONGO_URI);
```

---

## UUID / internalId Dual-Key Pattern

Every model has two identifiers:

| Field                                       | Purpose                                                          |
| ------------------------------------------- | ---------------------------------------------------------------- |
| `uuid` (String, unique)                     | **Public-facing** — used in API requests, responses, JWT payload |
| `internalId` (Number, unique, `Date.now()`) | **Internal relations** — used as foreign key in other models     |

**Foreign key relationships always use `internalId`**:

- `plant.userInternalId` → `user.internalId`
- `actionLog.plantInternalId` → `plant.internalId`
- `actionLog.userInternalId` → `user.internalId`

**Resolution flow:** API receives `uuid` → service resolves to `internalId` via `findByUUID()` → queries relations using `internalId`.

---

## Common Development Workflows

### Creating a New Endpoint

```javascript
// 1. DTO — Define validation
// dto/plant.dto.js
import { z } from "zod";
export const createPlantSchema = z.object({
  name: z.string().min(1),
  family: z.enum(["solanaceae", "cucurbitaceae", ...]),
});

// 2. Controller — Handle request
// controller/plant.controller.js
export async function getPlantStats(req, res, next) { ... }

// 3. Service — Business logic
// service/plant.service.js
async getPlantStats(plantUUID) { ... }

// 4. Route — Wire it up
// routes/plant.route.js
router.get("/:id/stats", getPlantStats);

// 5. Test — Write test
// test/plant.test.js
```

### Adding a New Rule Layer

```javascript
// 1. Create rule file
// service/engine/myNewLayer.js
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const raw = require("../../shared/rules/my_new_layer.json");
const rules = raw.rules.map((r, i) => ({ ... }));
export const layer = "myLayer";
export { rules };

// 2. Register in engine/index.js
import { rules as myRules, layer as myLayer } from "./myNewLayer.js";
const LAYER_ORDER = [..., { layer: myLayer, rules: myRules }];
```

---

## Troubleshooting

| Problem                           | Likely Cause                | Solution                                                  |
| --------------------------------- | --------------------------- | --------------------------------------------------------- |
| `ECONNREFUSED` on startup         | MongoDB not running         | Start `mongod`                                            |
| 401 on authenticated routes       | Expired or invalid JWT      | Call `/auth/refresh` to rotate tokens                     |
| ML service returns 502            | ML microservice not running | Start `uvicorn app.main:app --port 8000`                  |
| `INVALID_FILE_TYPE`               | Unsupported MIME type       | Use `image/jpeg`, `image/png`, or `image/webp`            |
| `Weather API 401`                 | Invalid or expired API key  | Check `WEATHER_API_KEY` in config.env                     |
| `MODULE_NOT_FOUND` for rules JSON | Missing rule file           | Ensure `shared/rules/*.json` exists for each engine layer |
| S3 upload fails                   | Incorrect S3 credentials    | Verify `S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY`      |
| `Email send failed`               | SMTP credentials wrong      | Check `EMAIL_USER`/`EMAIL_PASS` in config.env             |

---

## Contributing Guidelines

### Branch Naming

```
feature/<description>     # New features
fix/<description>         # Bug fixes
refactor/<description>    # Code refactoring
docs/<description>        # Documentation
test/<description>        # Test additions
```

### Commit Convention

```
<type>(<scope>): <description>

Types: feat, fix, refactor, test, docs, chore
Scope: auth, user, plant, plant-care, engine, ml, s3
```

### Pull Request Requirements

- All existing tests must pass
- New features must include tests
- No linting errors (`npx eslint Backend/`)
- Update API documentation if endpoints change

---

## Coding Standards

### JavaScript

- **Module system:** ESM (`import`/`export`) — `"type": "module"` in package.json
- **Naming:** `camelCase` for variables/functions, `PascalCase` for classes
- **File naming:** `kebab-case.js` for all files
- **Error handling:** Use `RouteError` for expected failures, let the global error handler catch unexpected ones
- **Async:** Always use `async/await` — no raw promises or callbacks
- **Imports:** Named exports for modules with multiple exports, default exports for single-class modules

### Architecture

- Controllers must be thin — no business logic, only request/response handling
- Services contain all business logic — no direct database access
- Repositories are the only layer that touches the database
- All dependencies are injected via the container
- UUIDs are the user-facing identifier; `internalId` is internal-only

---

## AI / Rule Engine Pipeline

### Analysis Flow

```mermaid
flowchart TD
    A[Client Request: POST /plants/:id/analyze] --> B[verifyPlantAccess]
    B --> C[PlantAnalyserService.analyzePlant]
    C --> D[PlantService.getEnginePlantInput]
    C --> E[UserService.getUserLocation]
    E --> F{Location exists?}
    F -->|Yes| G[WeatherService.getWeather]
    G --> H[WeatherDescriber.weatherDescribe]
    H --> I[WeatherDescriber.weatherDescribeForEngine]
    I --> J[Engine Input: weather + plant]
    F -->|No| K[Engine Input: plant only]
    D --> K
    J --> L[Engine.evaluate]
    K --> L
    L --> M[Engine Scores: water, fertilizer, pest, light]
    M --> N[PlantCareStateService.saveEngineOutput]
    N --> O[Score → Status Mapping]
    O --> P[Update plant care state]
    P --> Q[Log action]
    Q --> R[Response to client]
```

### AI Insights Flow

```mermaid
flowchart TD
    A[Client: POST /plants/:id/ai-insights] --> B[Get care state by plant UUID]
    B --> C{State exists?}
    C -->|No| D[404 Not Found]
    C -->|Yes| E[Call LLMService.generateResponse]
    E --> F[Build prompt with status + logs + scores]
    F --> G[Google Gemini API]
    G --> H[Parse response]
    H --> I[Store insights in care state]
    I --> J[Return insights to client]
```

### LLM Resilience

- **Model fallback**: Gemini models are tried in priority order: `gemini-2.5-flash` → `gemini-2.0-flash` → `gemini-1.5-flash`. Retries only on 429 (rate limit) and 503 (overloaded); permanent errors fail fast.
- **Markdown fence stripping**: LLM responses that wrap JSON in ` ```json...``` ` fences are automatically cleaned before parsing.
- **Harvest date fallback**: When LLM-derived `expectedHarvestDate` fails, a category-based fallback is used: crop = 90 days, flower = 60 days, tree = 365 days from planting.

---

## Roadmap & Future Improvements

| Priority | Feature                           | Impact                              |
| -------- | --------------------------------- | ----------------------------------- |
| P0       | Redis caching for weather data    | Reduce API calls, faster analysis   |
| P0       | Async ML detection with job queue | Non-blocking disease detection      |
| P1       | WebSocket real-time updates       | Push notifications for tasks/alerts |
| P1       | Docker + Docker Compose           | Reproducible local development      |
| P1       | CI/CD pipeline (GitHub Actions)   | Automated testing and deployment    |
| P2       | Prometheus metrics endpoint       | Production monitoring               |
| P2       | Sentry error tracking             | Proactive error detection           |
| P2       | Rate limiting                     | Abuse prevention                    |
| P3       | Multi-language support            | Internationalization                |
| P3       | Read replicas for MongoDB         | Query performance at scale          |
| P3       | Kubernetes manifests              | Orchestrated cloud deployment       |

---

## License

ISC License

Copyright (c) 2026

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted.
