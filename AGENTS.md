# TerraVision AI — Farming Assistant

Smart farming: AI disease detection (CNN ensemble), rule-based environmental analysis, Gemini-powered insights & tasks.

## Commands

```bash
npm run dev                 # nodemon on :5500 (Backend/)
npx eslint Backend/         # lint (flat config)
node test/service/<name>.test.js   # run 1 service test (~110 tests, bare Node assert)
node test/routes/run-route-tests.js # route integration tests (server must run)
node test-api.mjs           # standalone integration tests (server must run)
uvicorn app.main:app --reload --port 8000   # Ml-service/
```

Prerequisites: MongoDB, env vars, optional ML service. No test framework — bare `assert` + try/catch.

## Project Structure

```
Backend/
  app.js                 Express 5 entrypoint, middleware stack, route mounting
  config/                config.js + config.env (env vars, JWTs, S3 creds)
  controller/            4 files (auth, user, plant, plant-care) — thin, no logic
  service/               14 services + engine/ (7 layers) + common/ (token, bcrypt, email)
  repository/            5 repos — CRUD only, .lean(), no business logic
  model/                 4 Mongoose schemas + enums (user, plant, plantcare, actionlog)
  routes/                4 route files (auth, user, plant, plant-care)
  middlewares/           auth (JWT), error handler, emailValidator
  shared/                container.js (DI), db.js, s3Client, rules/ (7 JSON), util/
  dto/                   Zod schemas (PlantDTO, UserDTO)
  test/service/          Unit tests (bare assert + try/catch, 14 files)
  test/routes/           HTTP integration tests (4 route files + shared runner)

Ml-service/              FastAPI, :8000. 3-model CNN ensemble, 88 disease classes.
```

## Architecture

```
Route → Middleware → Controller → Service → Repository → MongoDB + External APIs
                                     ↓
            OpenWeatherMap, Google Gemini, Storj S3, Python ML (:8000)
```

- DI container: `Backend/shared/container.js` — all wiring in one file.
- Rule engine 7 layers: `global → soil → family → growth → watering → pest → light`.
- DB: MongoDB `terra_db` — 4 collections.

## Data Models

| Collection | Key Fields | FK |
|---|---|---|
| users | uuid, internalId, name, email, password, role, location, refreshToken | — |
| plants | uuid, internalId, userInternalId, name, category, family, growthStage, soil (type, moisture, lastFertilized, lastPruned), watering, disease, cdn | plant.userInternalId → user.internalId |
| plantcares | uuid, plantUUID, status, engineScores, activeTasks[], completedTasks[] | created on first analysis only |
| actionlogs | logId, plantUUID, plantInternalId, userUUID, userInternalId, actionType, description, metadata | 17 action types |

Enums (FAMILIES, GROWTH_STAGES, SOIL_TYPES, TASK_TYPES/STATUSES/PRIORITIES, ACTION_TYPES, WATER/NUTRIENT/HEALTH/LIGHT_STATUSES) in `model/plant-care.model.js` and `model/action-log.model.js`.

## API Routes

All mounted under `/api/v1`. Auth key: ✓ = `authenticate` middleware.

**Auth** (`/auth`): POST signup, login, refresh (public). POST logout (✓).

**Users** (`/users`): GET/PUT/DEL /:id (✓). POST/GET /email (✓). GET /email/verify?token= (public).

**Plants** (`/plants`):
- Public: POST /image/upload, POST /detect
- Auth: GET /, POST /. GET /:id, PUT /:id, DEL /:id.
  POST /:id/upload, /:id/image/upload, /:id/image/extract, /:id/detect.
  DEL /:id/images.

**Plant Care** (`/plants` — ✓ applied at router mount in app.js):
- POST /:id/analyze | GET /:id/care-state
- GET/POST/DEL /:id/logs
- PATCH /:id/water | POST /:id/fertilize, /:id/harvest | PATCH /:id/light
- POST /:id/treat-disease, /:id/prune
- GET /:id/tasks, /:id/tasks/overdue, /pending, /prioritized — read-only
- POST /:id/ai-insights, /:id/ai-insights/ask

## Service Dependency Graph

```
userRepo → userService
plantRepo + s3Repo + userService + llmService → plantService
s3Repo + userService → s3CloudService
tokenService + userService + passHasher → authService
plantRepo + userService + s3CloudService → diseaseDetectionService
weatherService + weatherDescriber + plantService + userService → plantAnalyserService
plantCareRepo → plantCareStateService
llmService → plantCareTaskGenerator, plantCareAiInsights
actionLogRepo + plantService → plantCareActionLogger
plantCareRepo + plantCareTaskGenerator + plantCareActionLogger → plantTaskCareManager
plantService + s3CloudService + llmService → plantVisionService
```

## Key Patterns

**UUID / internalId Dual-Key**: UUID = public-facing (API, JWT). internalId (Date.now()) = DB foreign keys. All relations via internalId. Resolution: API UUID → service resolves to internalId before querying. internalId NOT in JWT.

**Error handling**: `throw new RouteError(statusCode, message)` for expected failures. Express error middleware catches RouteError → JSON. JWT errors (TokenExpiredError, JsonWebTokenError) → 401. Everything else → 500.

**Response sanitization**: `HttpResponse.success()` strips `_id`, `__v`, `password`, `internalId`, `plantInternalId`, `userInternalId`, ObjectId, Buffer from all responses.

**Action logging**: Non-fatal (caught + console.error'd, never crashes response). Standalone ActionLog collection (not embedded). Stores both UUID + internalId per log for zero-lookup reads.

**Controllers**: Parse → validate → call service → format response. Zero business logic.

## Rule Engine

7 layers in order: global → soil → family → growth → watering → pest → light.

4 scores: waterScore, fertilizerScore, pestRiskScore, lightScore. Baseline 1.0, clamp [0.5, 2.0].

`final = clamp((1.0 + Σadditives) × Πmultipliers, 0.5, 2.0)`

Score → status: <0.8 = overwatered/needs_feed/healthy/low. 0.8-1.29 = satisfied/optimal/warning. 1.3-1.69 = low/diseased/high. ≥1.7 = thirsty/excess/critical/burn_risk.

Input: `{ weather{ temperature, humidity, condition, light, windSpeed }, plant{ category, family, ageDays, growthStage }, soil{ type, moisture? }, watering{ hoursSinceLastWatering? }, stress{ diseaseType?, severity? } }`

131 rules across 7 JSON files. Operators: eq, neq, gte, lte, gt, lt.

## Environment Variables (`Backend/config/config.env`)

| Variable | Notes |
|---|---|
| PORT | Default 5500 |
| MongoURI | `mongodb://127.0.0.1:27017` + appends `/terra_db` |
| ACCESS/REFRESH_TOKEN_SECRET | JWT keys |
| ACCESS/REFRESH_TOKEN_EXPIRES_IN | 15m / 7d |
| WEATHER_API_KEY | OpenWeatherMap |
| S3_REGION, BUCKET_NAME, ENDPOINT | Storj S3 |
| S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY | Storj creds |
| EMAIL_HOST, PORT, USER, PASS, FROM | SMTP (nodemailer) |
| DISEASE_DETECTION_URL | Default `http://127.0.0.1:8000` (ML service) |
| GEMINI_API_KEY / ApiKey | Google Gemini |

Ml-service/config.env: same S3 creds + `S3_FORCE_PATH_STYLE=true`.

## Known Gotchas

- **Care state NOT created at plant creation** — only on first `saveEngineOutput` (analyze).
- **`PlantCareActionLogger` constructor**: `(actionLogRepo, plantService)` — was `(plantCareStateRepo)`. Direct instantiation outside container is broken.
- **Logger methods require `user` object** `{ uuid, internalId? }`, not a plain UUID string.
- **`clearOldLogs` falsy bug**: `deleteOlderThan` returns a number (0 = none deleted), and `if (!result)` treats 0 as falsy → falsely returns "Care state not found".
- **Plant-care route auth**: Applied at router mount in app.js (`authenticate` before plantCareRouter), not per-route in the route file itself.
- **`fertilizePlant`**: Now sets `soil.lastFertilized` (mutates DB). **`updateLight`**: Still only logs, doesn't mutate DB.
- **`updateWatering`**: Replaces entire `watering` subdocument via dot-notation.
- **`deleteFile` (S3)**: Logs error but never throws — silent failure.
- **Weather failure**: Analysis continues without weather — `_weatherWarning` attached to engine result.
- **DiseaseDetectionService**: Errors return healthy fallback (does NOT throw RouteError).
- **ML service**: Port 8000 (uvicorn), 88 classes, 3-model CNN ensemble (EfficientNetV2B0+ResNet101V2+MobileNetV2), weights [0.2,0.3,0.5], temperature 2.0. Endpoints: `POST /predict` (plant-specific), `POST /predict/general`.
- **Gemini fallback**: 2.5-flash → 2.0-flash → 1.5-flash on 429/503 only.
- **DB startup failure**: `process.exit(1)` — server won't start if MongoDB is down.
- **Express 5.x**: Literal routes take precedence over param routes — order matters in route files.
- **Reply sanitization**: `HttpResponse.#sanitize` strips ALL internalId fields (`internalId`, `plantInternalId`, `userInternalId`) globally — verify before exposing internal IDs in new endpoints.
- **Task system fully automated**: Tasks are a read-only view of what needs to be done. Performing the matching action auto-completes the task — no manual CRUD endpoints exist (no addTask, cancelTask, reopenTask, generateTasks, completeTask).
- **Auto-archive on completion**: Completed tasks are removed from `activeTasks` and never pushed to `completedTasks` — only visible in action logs.
- **`performAction` helper**: Wraps each action endpoint with action → auto-complete matching task → re-analysis → conditional task generation → AI insights. Errors in any step are caught so the endpoint always returns 200.
- **Plant model soil subdocument**: Added `soil.lastFertilized` and `soil.lastPruned` — read by engine via `getEnginePlantInput()` to apply new soil rules (e.g., `soil_recently_fertilized_nutrient_sufficiency` reduces fertilizerScore by 0.3 if fertilized within 7 days).
- **Conditional task generation**: After re-analysis, new tasks are generated only when care status is not fully optimal (water !== "satisfied" or nutrients !== "optimal" or health !== "healthy" or light !== "optimal").

## Workflow Notes

- Complex tasks → use sub-agents, return summary to main.
- After each compaction, save summary to `@changes.md` in root.
- Complex changes: include full context (why, affected files, edge cases). Simple: short description.

## Team Agents (sub-agents)

Located in `.opencode/agents/`. Invoke via `@team-<name>`.

| Agent | File | Purpose |
|---|---|---|
| `@team-test` | `.opencode/agents/team-test.md` | Organizes tests into `Backend/test/service/` and `Backend/test/routes/`, moves files, updates import paths, registers new tests in doc files |
| `@team-docs` | `.opencode/agents/team-docs.md` | Scans git unstaged files, detects changes to services/routes/models, patches AGENTS.md, API.md, TEST_MODULES_SUMMARY.md accordingly |
| `@team-committer` | `.opencode/agents/team-committer.md` | Stages files, generates conventional commit messages from diff, commits using `type(scope): description` format |

## Test Directory Structure

```
Backend/test/
  TEST_MODULES_SUMMARY.md      # Root-level test documentation
  QUICK_REFERENCE.md           # Quick reference docs
  errors.md                    # Error notes
  service/                     # Unit tests (bare assert + try/catch)
    auth.test.js               # AuthService (6 tests)
    user.test.js               # UserService (11 tests)
    plant.test.js              # PlantService (9 tests)
    disease-detection.test.js  # DiseaseDetectionService (7 tests)
    s3Cloud.test.js            # S3CloudService (16 tests)
    weather.test.js            # WeatherService (3 tests)
    token.test.js              # TokenService (7 tests)
    engine.test.js             # Rule engine (16 scenarios)
    plant-care-state.test.js   # PlantCareState/Logger/Generator/Manager (10 tests)
    plant-care-ai-insights.test.js  # PlantCareAiInsights (17 tests)
    plant-service-extra.test.js     # Extra plant service tests
    password-hasher.test.js         # Password hasher tests
    lifecycle-scenario.mjs          # Integration scenario
  routes/                      # HTTP integration tests
    helpers/setup.js           # Shared HTTP test utilities
    run-route-tests.js         # Route test runner (imports all route-*.test.js)
    route-auth.test.js         # Auth endpoints (6 tests)
    route-plant.test.js        # Plant endpoints (10 tests)
    route-plant-care.test.js   # Plant-care endpoints (18 tests)
    route-user.test.js         # User endpoints (6 tests)
```
