# 🚀 Quick Start Guide - Service Tests

## 📚 Documentation Files Created

1. **SERVICES_ARCHITECTURE.md** - Comprehensive architecture overview
2. **TEST_MODULES_SUMMARY.md** - Detailed test module information
3. **QUICK_REFERENCE.md** - This file

---

## Test Files Overview

### Unit / Service Tests (10 files, ~92 tests)

| Test File | Service(s) Tested | Tests | Run Command |
|---|---|---|---|---|
| `auth.test.js` | AuthService | 6 | `node Backend/test/service/auth.test.js` |
| `user.test.js` | UserService | 11 | `node Backend/test/service/user.test.js` |
| `plant.test.js` | PlantService | 9 | `node Backend/test/service/plant.test.js` |
| `disease-detection.test.js` | DiseaseDetectionService | 7 | `node Backend/test/service/disease-detection.test.js` |
| `s3Cloud.test.js` | S3CloudService | 16 | `node Backend/test/service/s3Cloud.test.js` |
| `weather.test.js` | WeatherService | 3 | `node Backend/test/service/weather.test.js` |
| `token.test.js` | TokenService | 7 | `node Backend/test/service/token.test.js` |
| `engine.test.js` | Engine (7-layer rule eval) | 16 | `node Backend/test/service/engine.test.js` |
| `plant-care-state.test.js` | PlantCareState/Logger/Generator/Manager | 10 | `node Backend/test/service/plant-care-state.test.js` |
| `plant-care-ai-insights.test.js` | PlantCareAiInsights | 17 | `node Backend/test/service/plant-care-ai-insights.test.js` |

### Route / Integration Tests (4 files, ~46 tests)

| Test File | Routes Tested | Run Command |
|---|---|---|
| `route-auth.test.js` | Auth (4 endpoints) | `node Backend/test/routes/run-route-tests.js` |
| `route-plant.test.js` | Plants (9 endpoints) | (same runner) |
| `route-plant-care.test.js` | Plant-Care (17 endpoints) | (same runner) |
| `route-user.test.js` | Users (6 endpoints) | (same runner) |

**Run all route tests:** `node Backend/test/routes/run-route-tests.js`

---

## 💡 Service Purpose Summary

| Service                     | Purpose                             | Key Task                                 |
| --------------------------- | ----------------------------------- | ---------------------------------------- |
| **AuthService**             | User authentication & authorization | signup, login, logout, token refresh     |
| **UserService**             | User data management                | CRUD operations on users                 |
| **PlantService**            | Plant management                    | CRUD operations on plants                |
| **DiseaseDetectionService** | ML disease detection                | Send images to ML service, store results |
| **S3CloudService**          | Cloud file storage                  | Upload/download/delete files in S3       |
| **WeatherService**          | Weather data retrieval              | Get weather by city or coordinates       |

---

## 📋 Dependencies Chain

### AuthService

```
AuthService
├─ TokenService (generates JWT tokens)
├─ UserService (manages user data)
│  └─ UserRepository (database)
└─ PasswordHasher (bcrypt encryption)
```

### UserService

```
UserService
└─ UserRepository (database)
```

### PlantService

```
PlantService
├─ PlantRepository (database)
└─ S3CloudRepository (S3 storage)
```

### DiseaseDetectionService

```
DiseaseDetectionService
├─ PlantRepository (database)
├─ axios (HTTP client)
└─ DISEASE_DETECTION_URL (ML microservice)
```

### S3CloudService

```
S3CloudService
└─ S3Repository (S3 client wrapper)
   └─ AWS SDK (actual S3 operations)
```

### WeatherService

```
WeatherService
├─ axios (HTTP client)
└─ WEATHER_API_KEY (API authentication)
```

---

## 🧪 Test Execution Quick Commands

### Run All Unit Tests

```bash
node Backend/test/service/auth.test.js && node Backend/test/service/user.test.js && node Backend/test/service/plant.test.js && node Backend/test/service/disease-detection.test.js && node Backend/test/service/s3Cloud.test.js && node Backend/test/service/weather.test.js && node Backend/test/service/token.test.js && node Backend/test/service/engine.test.js && node Backend/test/service/plant-care-state.test.js && node Backend/test/service/plant-care-ai-insights.test.js
```

### Run All Route Tests (requires server up)

```bash
node Backend/test/routes/run-route-tests.js
```

### Run by Category

```bash
# Authentication
node Backend/test/service/auth.test.js

# User Management
node Backend/test/service/user.test.js

# Plant Management
node Backend/test/service/plant.test.js

# ML Integration
node Backend/test/service/disease-detection.test.js

# Cloud Storage
node Backend/test/service/s3Cloud.test.js

# Weather
node Backend/test/service/weather.test.js

# JWT Token
node Backend/test/service/token.test.js

# Rule Engine
node Backend/test/service/engine.test.js

# Plant Care Subsystem
node Backend/test/service/plant-care-state.test.js
node Backend/test/service/plant-care-ai-insights.test.js

# Route Integration (all 4 modules)
node Backend/test/routes/run-route-tests.js
```


---

## 🔍 Understanding Test Patterns

All tests follow this structure:

```javascript
import assert from "assert";
import { serviceToTest } from "../shared/container.js";

async function runTests() {
  console.log("Running [Service]Service Tests...\n");

  // Test 1: Basic functionality
  try {
    const result = await service.method();
    assert(condition, "Error message");
    console.log("✅ Test 1 passed: Description");
  } catch (error) {
    console.error("❌ Test 1 failed:", error.message);
  }

  // Test 2: Error handling
  try {
    await service.invalidOperation();
    console.log("❌ Test 2 failed: Should throw error");
  } catch (error) {
    assert(error instanceof ExpectedError);
    console.log("✅ Test 2 passed: Error correctly thrown");
  }

  console.log("\n🎉 [Service]Service tests completed\n");
}

runTests().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
```

---

## 📊 Test Coverage Matrix (Service Unit Tests)

```
┌─────────────────────────────────────┬──────┬──────┬──────┐
│ Test Category                       │ Pass │ Fail │ Skip │
├─────────────────────────────────────┼──────┼──────┼──────┤
│ Authentication (auth)               │  6   │  -   │  -   │
│ User CRUD                           │  11  │  -   │  -   │
│ Plant CRUD                          │  9   │  -   │  -   │
│ Disease Detection                   │  7   │  -   │  1*  │
│ S3 Cloud Operations                 │  16  │  -   │  -   │
│ Weather API                         │  3   │  -   │  -   │
│ Token Service (JWT)                 │  7   │  -   │  -   │
│ Rule Engine (16 scenarios)          │  16  │  -   │  -   │
│ Plant Care State/Logger/Tasks       │  10  │  -   │  -   │
│ Plant Care AI Insights              │  17  │  -   │  -   │
├─────────────────────────────────────┼──────┼──────┼──────┤
│ TOTAL Unit Tests                    │  102 │  -   │  1*  │
└─────────────────────────────────────┴──────┴──────┴──────┘

* Disease Detection test may skip if ML service is not running
```

### Route Integration Tests (~46 tests across 4 modules)

```
┌─────────────────────────────┬───────────┐
│ Module                      │  Tests    │
├─────────────────────────────┼───────────┤
│ Auth Routes (4 endpoints)   │  6        │
│ Plant Routes (9 endpoints)  │  10       │
│ Plant-Care (17 endpoints)   │  18       │
│ User Routes (6 endpoints)   │  6        │
├─────────────────────────────┼───────────┤
│ Total                       │  ~46      │
└─────────────────────────────┴───────────┘

Run: `node Backend/test/routes/run-route-tests.js`
```

---

## ⚡ Quick Reference - Method Signatures

### AuthService

```javascript
authService.signup({ name, email, password, location });
authService.login({ email, password });
authService.logout(internalId);
authService.refresh(refreshToken);
```

### UserService

```javascript
userService.findByUUID(uuid);
userService.findByInternalId(internalId);
userService.findByEmail(email);
userService.createUser(data);
userService.setRefreshToken(internalId, token);
userService.clearRefreshToken(internalId);
userService.verifyUser(internalId);
userService.deleteUser(internalId);
```

### PlantService

```javascript
plantService.createPlant(data);
plantService.getPlantByUUID(uuid);
plantService.getUserPlants(userInternalId);
plantService.updatePlant(uuid, updateData);
plantService.deletePlant(uuid);
plantService.getAllPlants();
plantService.paginatePlants({ page, limit });
```

### DiseaseDetectionService

```javascript
diseaseDetectionService.detectDisease({ key, userId, plantId });
diseaseDetectionService.updateDiseaseHistory(plantId, mlResponse);
```

### S3CloudService

```javascript
s3CloudService.validateImageMimeType(fileType);
s3CloudService.buildPlantImagePath({ userId, plantId, fileName });
s3CloudService.validatePlantImageKey(key);
s3CloudService.generateUploadUrl({ userId, plantId, fileName, fileType });
s3CloudService.generateGetUrl(key);
s3CloudService.deleteFile(key);
```

### WeatherService

```javascript
weatherService.getWeather({ city, coordinates });
weatherService.resolveLocation(location);
weatherService.fetchWeather(request);
weatherService.fetchByCity(city);
weatherService.fetchByCoordinates(coordinates);
weatherService.transform(data);
```

### TokenService

```javascript
tokenService.generateAccessToken(payload);
tokenService.generateRefreshToken(payload);
tokenService.verifyAccessToken(token);
tokenService.verifyRefreshToken(token);
```

### Rule Engine

```javascript
evaluate(input);           // → {waterScore, fertilizerScore, pestRiskScore, lightScore, _appliedRules}
evaluateByLayer(input);    // → {layers: Object, final: Object}
getRuleCount();            // → {global, soil, plantFamily, growthStage, watering, pest, light, total}
```

### PlantCareStateService

```javascript
plantCareStateService.saveEngineOutput(plantUUID, engineResult);
plantCareStateService.getByPlantUUID(plantUUID);
```

### PlantCareActionLogger

```javascript
actionLogger.addActionLog(plantUUID, user, { actionType, description, metadata });
actionLogger.logWatering(plantUUID, user, description, metadata);
actionLogger.getRecentLogs(plantUUID, last);
```

### PlantCareTaskGenerator

```javascript
taskGenerator.generateTasksFromStatus(status, engineScores);
```

### PlantTaskCareManager

```javascript
taskManager.completeTask(plantUUID, taskId, user, { archive });
```

### PlantCareAiInsights

```javascript
aiInsights.generateInsights(plantUUID, status, actionLogs);
aiInsights.answerQuestion(plantUUID, question, actionLogs);
```

---

## 🛠️ Environment Setup

### Required Environment Variables

```bash
# Weather API
WEATHER_API_KEY=your_openweathermap_api_key

# ML Microservice
DISEASE_DETECTION_URL=http://localhost:8000

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your_bucket_name

# Database (NeDB - local)
# No configuration needed for NeDB

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d
```

---

## 🎯 Test Execution Workflow

1. **Setup Phase**
   - Import services from container.js
   - Create test data
   - Display header message

2. **Test Phase**
   - Execute test case
   - Assert expected conditions
   - Catch and log errors

3. **Cleanup Phase**
   - Delete test data
   - Display completion message
   - Exit with status code

4. **Error Handling**
   - Try-catch blocks for async operations
   - Console messages for each test (✅/❌)
   - Process exit on fatal errors

---

## 📈 Service Dependency Graph

```
Repositories (Database/Storage)
├─ UserRepository
├─ PlantRepository
└─ S3Repository

Infrastructure Services
├─ TokenService
├─ PasswordHasher
└─ EmailService (future)

Business Services
├─ AuthService ─┬─→ TokenService
│              ├─→ UserService
│              └─→ PasswordHasher
│
├─ UserService ─→ UserRepository
│
├─ PlantService ─┬─→ PlantRepository
│               └─→ S3CloudRepository
│
├─ DiseaseDetectionService ─┬─→ PlantRepository
│                          └─→ HTTP (ML Service)
│
├─ S3CloudService ─→ S3Repository
│
└─ WeatherService ─→ HTTP (Weather API)
```

---

## 🎓 Learning Path

1. **Start here:** Understand architecture diagram
2. **Read:** SERVICES_ARCHITECTURE.md
3. **Reference:** This file
4. **Review:** TEST_MODULES_SUMMARY.md
5. **Run:** Individual test files
6. **Explore:** Test source code
7. **Modify:** Add additional tests as needed

---

## 🚀 Next Steps

- [ ] Read all doc files (QUICK_REFERENCE, TEST_MODULES_SUMMARY)
- [ ] Run unit tests: `node Backend/test/service/engine.test.js && node Backend/test/service/token.test.js`
- [ ] Run route tests: `node Backend/test/routes/run-route-tests.js`
- [ ] Write tests for uncovered critical services (PlantAnalyser, PlantCareAction, LLM)
- [ ] Add success-path tests for WeatherService
- [ ] Set up CI/CD pipeline
- [ ] Add mocking for external services

---

## 💬 Questions?

Refer to these documentation files for detailed information:

- **Architecture Questions** → SERVICES_ARCHITECTURE.md
- **Test Details** → TEST_MODULES_SUMMARY.md
- **Implementation Details** → Service source files
- **API Details** → Controller/Route files

---

Generated: May 2026
Last Updated: June 11, 2026
