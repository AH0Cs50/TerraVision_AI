# 🧪 Test Module Summary

## Created Test Files

Located in `Backend/test/`. All tests use bare Node.js `assert` with try/catch (no test framework). Route tests use a shared HTTP helper.

---

## 📋 Unit / Service Test Files

### 1. **auth.test.js** (6 Tests)

Tests `AuthService` (signup, login, logout, token refresh via DI container).

**Tests:**
1. ✅ Signup successful
2. ✅ Duplicate email rejection
3. ✅ Login successful
4. ✅ Wrong password rejection
5. ✅ Token refresh
6. ✅ Logout

**Dependencies Tested:** TokenService, UserService, PasswordHasher, RouteError handling

---

### 2. **user.test.js** (11 Tests)

Tests `UserService` (CRUD, token management, validation via DI container).

**Tests:**
1. ✅ Create user
2. ✅ Find user by UUID
3. ✅ Find user by Internal ID
4. ✅ Find user by Email
5. ✅ Set refresh token
6. ✅ Verify user
7. ✅ Clear refresh token
8. ✅ Missing email validation (BAD_REQUEST)
9. ✅ Duplicate email rejection (CONFLICT)
10. ✅ Delete user
11. ✅ Deleted user not found (NOT_FOUND)

**Dependencies Tested:** UserRepository, RouteError (BAD_REQUEST, CONFLICT, NOT_FOUND)

---

### 3. **plant.test.js** (9 Tests)

Tests `PlantService` (CRUD, pagination via DI container).

**Tests:**
1. ✅ Create plant
2. ✅ Get plant by UUID
3. ✅ Get user's plants
4. ✅ Create multiple plants
5. ✅ Update plant
6. ✅ Get all plants
7. ✅ Paginate plants
8. ✅ Delete plant
9. ✅ Deleted plant not found

**Dependencies Tested:** PlantRepository, S3CloudRepository (injected), User-Plant relationship

---

### 4. **disease-detection.test.js** (7 Tests)

Tests `DiseaseDetectionService` (ML microservice integration via DI container).

**Tests:**
1. ✅ Service initialization
2. ✅ Detect disease with valid key
3. ✅ Invalid key format rejection
4. ✅ Update disease history
5. ✅ Update healthy plant status
6. ✅ Non-existent plant rejection
7. ✅ HTTP client configuration

**Dependencies Tested:** PlantRepository, Axios, ML microservice endpoint, response transformation

---

### 5. **s3Cloud.test.js** (16 Tests)

Tests `S3CloudService` (cloud storage operations via DI container).

**Tests:**
1. ✅ Validate JPEG MIME type
2. ✅ Validate PNG MIME type
3. ✅ Validate WebP MIME type
4. ✅ Reject invalid MIME type (GIF)
5. ✅ Reject non-image type (video)
6. ✅ Build plant image path
7. ✅ Handle special characters in path
8. ✅ Validate correct S3 key format
9. ✅ Reject invalid S3 key format
10. ✅ Reject null key
11. ✅ Reject empty key
12. ✅ Reject non-string key
13. ✅ Generate upload URL
14. ✅ Reject invalid MIME type for upload
15. ✅ Generate GET URL
16. ✅ Delete file operation

**Dependencies Tested:** S3Repository, AWS SDK signed URLs, MIME validation, path sanitization

---

### 6. **weather.test.js** (3 Tests)

Tests `WeatherService` (error paths only via DI container).

**Tests:**
1. ✅ Empty object input throws
2. ✅ String input throws

**Note:** No success-path tests (requires live OpenWeatherMap API key).

---

### 7. **token.test.js** (7 Tests)

Tests `TokenService` (JWT generation/verification — direct instantiation).

**Tests:**
1. ✅ Generate access token produces valid JWT
2. ✅ Generate refresh token produces valid JWT
3. ✅ Verify valid access token decodes correctly
4. ✅ Verify valid refresh token decodes correctly
5. ✅ Invalid access token returns null
6. ✅ Invalid refresh token returns null
7. ✅ Access token fails against refresh secret (wrong key)

**Dependencies Tested:** jsonwebtoken, JWT secret configuration

---

### 8. **engine.test.js** (16 Scenarios)

Tests the 7-layer rule engine (direct import, no DI).

**Tests (16 TC):**
1. ✅ Optimal / baseline conditions
2. ✅ Extreme heat + low humidity + sandy + drought
3. ✅ Cold + rainy + clay + mature
4. ✅ Fungal disease + high humidity + storm
5. ✅ Succulent + aridisols (desert) low demand
6. ✅ Tropical + entisols + germination
7. ✅ Legumes + vegetative low fertilizer demand
8. ✅ Bacterial disease + heat + severe drought
9. ✅ Herbs + flowering -- pest resistant
10. ✅ Storm + vertisols + seedling
11. ✅ Grasses + inceptisols + medium severity pest
12. ✅ Minimal input (no watering/stress)
13. ✅ Wind + high ET (evapotranspiration)
14. ✅ Overwatering -- clay + recent rain + cool
15. ✅ Berries + silt moderate conditions
16. ✅ Palm + intense light (light score focus)

**Layers Tested:** global → soil → family → growth → watering → pest → light (all 7)

---

### 9. **plant-care-state.test.js** (10 Tests)

Tests 4 plant-care services (direct instantiation with mocks).

**PlantCareTaskGenerator** (4 tests):
1. ✅ Valid LLM array response returns parsed tasks
2. ✅ Non-array LLM response returns []
3. ✅ LLM throws error returns []
4. ✅ Invalid task types filtered out

**PlantCareActionLogger** (3 tests):
1. ✅ addActionLog stores action
2. ✅ logWatering convenience method
3. ✅ getRecentLogs returns correct count

**PlantCareStateService** (2 tests):
1. ✅ saveEngineOutput creates new care state
2. ✅ saveEngineOutput updates existing care state

**PlantTaskCareManager** (3 tests):
1. ✅ completeTask moves from active to completed
2. ✅ completeTask returns null for non-existent task
3. ✅ completeTask with archive=true skips pushToCompleted

---

### 10. **plant-care-ai-insights.test.js** (17 Tests)

Tests `PlantCareAiInsights` (direct instantiation with mock LLM).

**Tests:**
1. ✅ Returns summary + recommendations from valid JSON
2. ✅ Empty actionLogs still works
3. ✅ Recent logs included in prompt context
4. ✅ Only passes last 10 logs to LLM
5. ✅ answerQuestion returns parsed response
6. ✅ answerQuestion includes question in prompt
7. ✅ Handles plain string JSON
8. ✅ Handles markdown-wrapped JSON
9. ✅ Handles extra surrounding text
10. ✅ Handles empty/blank LLM response gracefully
11. ✅ Handles non-JSON LLM response gracefully
12. ✅ Handles LLM returning object with text property
13. ✅ Handles LLM throwing error gracefully
14. ✅ Handles null/undefined status gracefully
15. ✅ Handles null/undefined actionLogs gracefully
16. ✅ Handles recommendations that is not an array
17. ✅ Handles missing summary field

---

## 📋 Route / Integration Test Files

### route-auth.test.js (6 Tests)

Tests all 4 auth endpoints via HTTP (uses shared setup):
1. ✅ POST /auth/signup — 201
2. ✅ POST /auth/signup duplicate — 409
3. ✅ POST /auth/login — 200
4. ✅ POST /auth/login wrong password — 401
5. ✅ POST /auth/refresh — 200
6. ✅ POST /auth/logout — 200

### route-plant.test.js (10 Tests)

Tests 9 plant endpoints via HTTP:
1. ✅ POST /plants — 201
2. ✅ GET /plants — 200
3. ✅ GET /plants/:id — 200
4. ✅ PUT /plants/:id — 200
5. ✅ POST /plants/:id/image/upload — 200
6. ✅ POST /plants/:id/detect — 200
7. ✅ POST /plants/image/extract — 200
8. ✅ DELETE /plants/:id — 200
9. ✅ POST /plants/image/upload public — 200
10. ✅ POST /plants/detect public — 200

### route-plant-care.test.js (18 Tests)

Tests all 17 plant-care endpoints:
1. ✅ POST /plants/:id/analyze — 200
2. ✅ GET /plants/:id/care-state — 200/404
3. ✅ GET /plants/:id/logs?last=5 — 200
4. ✅ POST /plants/:id/logs — 201
5.-10. ✅ All 6 action endpoints (water, fertilize, harvest, light, treat-disease, prune) — 200
11.-14. ✅ All 4 task endpoints (tasks, overdue, pending, prioritized) — 200
15. ✅ POST /plants/:id/ai-insights — 200
16.-17. ✅ POST /plants/:id/ai-insights/ask — 400 (no question) / 200
18. ✅ DELETE /plants/:id/logs — 200

### route-user.test.js (6 Tests)

Tests all 6 user endpoints:
1. ✅ GET /users/:id — 200
2. ✅ PUT /users/:id — 200
3. ✅ POST /users/email — 200
4. ✅ GET /users/email — 200
5. ✅ GET /users/email/verify?token=bad — 200/400
6. ✅ DELETE /users/:id — 200

---

## 🚀 Running Tests

### Run Individual Unit Tests

```bash
node Backend/test/service/auth.test.js
node Backend/test/service/user.test.js
node Backend/test/service/plant.test.js
node Backend/test/service/disease-detection.test.js
node Backend/test/service/s3Cloud.test.js
node Backend/test/service/weather.test.js
node Backend/test/service/token.test.js
node Backend/test/service/engine.test.js
node Backend/test/service/plant-care-state.test.js
node Backend/test/service/plant-care-ai-insights.test.js
```

### Run All Route Tests

```bash
node Backend/test/routes/run-route-tests.js
```

### Run All Unit Tests (sequential)

```bash
node Backend/test/service/auth.test.js && node Backend/test/service/user.test.js && node Backend/test/service/plant.test.js && node Backend/test/service/disease-detection.test.js && node Backend/test/service/s3Cloud.test.js && node Backend/test/service/weather.test.js && node Backend/test/service/token.test.js && node Backend/test/service/engine.test.js && node Backend/test/service/plant-care-state.test.js && node Backend/test/service/plant-care-ai-insights.test.js
```

---

## 📊 Test Statistics

### Unit Tests

| Service / Module       | Test File                 | # Tests      |
| ---------------------- | ------------------------- | ------------ |
| Auth Service           | auth.test.js              | 6            |
| User Service           | user.test.js              | 11           |
| Plant Service          | plant.test.js             | 9            |
| Disease Detection      | disease-detection.test.js | 7            |
| S3 Cloud Service       | s3Cloud.test.js           | 16           |
| Weather Service        | weather.test.js           | 3            |
| Token Service          | token.test.js             | 7            |
| Rule Engine            | engine.test.js            | 16           |
| Plant Care Subsystem   | plant-care-state.test.js  | 10           |
| Plant Care AI Insights | plant-care-ai-insights.test.js | 17      |
| **TOTAL**              | **10 files**              | **~102**     |

### Route / Integration Tests

| Module             | File                       | # Tests      |
| ------------------ | -------------------------- | ------------ |
| Auth Routes        | route-auth.test.js         | 6            |
| Plant Routes       | route-plant.test.js        | 10           |
| Plant Care Routes  | route-plant-care.test.js   | 18           |
| User Routes        | route-user.test.js         | 6            |
| **TOTAL**          | **4 files**                | **~40**      |

---

## 🔍 Test Coverage by Category

### Authentication & Authorization

- Signup flow ✅
- Login flow ✅
- Token generation & refresh ✅
- Logout flow ✅
- Password hashing ✅ (indirect via auth tests)

### User Management

- User creation ✅
- User retrieval (UUID, Internal ID, Email) ✅
- User verification ✅
- User deletion ✅
- Token management ✅
- Input validation ✅

### Plant Management

- Plant creation ✅
- Plant retrieval (UUID, User plants) ✅
- Plant update ✅
- Plant deletion ✅
- Pagination ✅
- User-plant relationship ✅

### Disease Detection

- ML service integration ✅
- Disease history tracking ✅
- Response transformation ✅
- Error handling ✅
- HTTP client configuration ✅

### Cloud Storage

- MIME type validation ✅
- Path building & sanitization ✅
- S3 key validation ✅
- Signed URL generation (PUT & GET) ✅
- File deletion ✅

### Weather API

- Error handling ✅
- Success paths (no live API key in tests)

### Token Service (JWT)

- Access/refresh token generation ✅
- Token verification (valid + invalid) ✅
- Secret isolation check ✅

### Rule Engine

- All 7 layers (global → light) ✅
- 16 diverse scenarios ✅
- Per-layer + combined evaluation ✅
- Rule counting ✅

### Plant Care Subsystem

- Task generation from LLM ✅
- Task completion workflow ✅
- Care state save/create/update ✅
- Action logging (add + convenience + query) ✅
- AI insights JSON parsing (17 edge cases) ✅

### Route Integration

- All auth endpoints ✅
- All user endpoints ✅
- All plant-care endpoints ✅
- Plant endpoints (partial) ⚠️

### Known Gaps (No Service-Level Test)

- `PlantAnalyserService.analyzePlant()` — core analysis pipeline
- `PlantCareActionService.performAction()` — action orchestrator
- `LLMService` — Gemini model fallback logic
- `PlantVisionService.extractImageData()` — image → LLM
- `EmailService` — nodemailer email sending
- `PasswordHasher` — direct bcrypt hash/compare tests

---

## 🛠️ Testing Patterns

### Service Tests (container.js)

1. Import service from `../shared/container.js`
2. Create test data (using the real service methods)
3. Run test cases with try-catch / assert
4. Display results with ✅/❌ indicators
5. Cleanup test data (delete what was created)

### Service Tests (direct instantiation)

Used for services requiring mocks or no DB:
1. Instantiate service with mock dependencies
2. Run test cases with try-catch / assert
3. Verify mock interactions

### Route Tests (HTTP integration)

1. `setup.js` handles server start/stop, HTTP helper, test counters
2. Shared user + plant created once per module
3. Each test calls endpoint via `req(method, path, options)`
4. Assert status code + response shape
5. Results tallied in `run-route-tests.js`

---

## ⚠️ Prerequisites for Running Tests

1. **Environment Variables** (from `Backend/config/config.env`)
   - MongoDB URI (required, all service tests use live DB)
   - JWT secrets (required for token tests)
   - `WEATHER_API_KEY` — weather tests use live API
   - `DISEASE_DETECTION_URL` — disease detection tests
   - S3 credentials — cloud storage tests

2. **Running Services**
   - MongoDB must be running (all service tests persist data)
   - ML Microservice (optional, for disease detection)
   - AWS S3 access (optional, for S3 tests)
   - Server (required for route tests only)

3. **Node.js 18+** (ES modules)

---

## 📝 Notes

### Test Isolation

- Service tests create + clean up their own test data
- Route tests create a shared user/plant per module
- Tests don't depend on execution order

### External Services

- Weather tests use real OpenWeatherMap API
- Disease detection tests require ML service (fallback on error)
- S3 tests use real AWS S3 credentials
- Some tests skip if services are unavailable

### Mocking (Future Enhancement)

- LLMService (Gemini) — currently unmocked in most tests
- External API calls (Weather, ML)
- S3 operations
- Email sending

---

## 🎯 Next Steps

1. ✅ Run existing unit tests
2. ✅ Run route integration tests
3. ⬜ Write tests for uncovered critical services: PlantAnalyser (`analyzePlant`), PlantCareAction (`performAction`), LLMService
4. ⬜ Add success-path tests for WeatherService
5. ⬜ Set up CI/CD pipeline
6. ⬜ Add coverage reporting with c8/nyc
7. ⬜ Add mocking for external services

---

Generated: May 2026 | Last Updated: June 11, 2026
