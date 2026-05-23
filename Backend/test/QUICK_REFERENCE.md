# 🚀 Quick Start Guide - Service Tests

## 📚 Documentation Files Created

1. **SERVICES_ARCHITECTURE.md** - Comprehensive architecture overview
2. **TEST_MODULES_SUMMARY.md** - Detailed test module information
3. **QUICK_REFERENCE.md** - This file

---

## 🎯 Service Dependencies at a Glance

```
┌─ AuthService
│  ├─ Depends on: TokenService, UserService, PasswordHasher
│  ├─ Test: node Backend/test/auth.test.js
│  └─ 6 test cases
│
├─ UserService
│  ├─ Depends on: UserRepository
│  ├─ Test: node Backend/test/user.test.js
│  └─ 11 test cases
│
├─ PlantService
│  ├─ Depends on: PlantRepository, S3CloudRepository
│  ├─ Test: node Backend/test/plant.test.js
│  └─ 9 test cases
│
├─ DiseaseDetectionService
│  ├─ Depends on: PlantRepository, axios, DISEASE_DETECTION_URL
│  ├─ Test: node Backend/test/disease-detection.test.js
│  └─ 7 test cases
│
├─ S3CloudService
│  ├─ Depends on: S3Repository, AWS SDK
│  ├─ Test: node Backend/test/s3Cloud.test.js
│  └─ 16 test cases
│
└─ WeatherService
   ├─ Depends on: axios, WEATHER_API_KEY
   ├─ Test: node Backend/test/weather.test.js
   └─ 3 test cases (existing)
```

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

### Run All Tests

```bash
node Backend/test/auth.test.js && \
node Backend/test/user.test.js && \
node Backend/test/plant.test.js && \
node Backend/test/disease-detection.test.js && \
node Backend/test/s3Cloud.test.js && \
node Backend/test/weather.test.js
```

### Run by Category

**Authentication:**

```bash
node Backend/test/auth.test.js
```

**User Management:**

```bash
node Backend/test/user.test.js
```

**Plant Management:**

```bash
node Backend/test/plant.test.js
```

**ML Integration:**

```bash
node Backend/test/disease-detection.test.js
```

**Cloud Storage:**

```bash
node Backend/test/s3Cloud.test.js
```

**Weather:**

```bash
node Backend/test/weather.test.js
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

## 📊 Test Coverage Matrix

```
┌─────────────────────────────────────┬──────┬──────┬──────┐
│ Test Category                       │ Pass │ Fail │ Skip │
├─────────────────────────────────────┼──────┼──────┼──────┤
│ Authentication                      │  6   │  -   │  -   │
│ User CRUD                           │  11  │  -   │  -   │
│ Plant CRUD                          │  9   │  -   │  -   │
│ Disease Detection                   │  7   │  -   │  1*  │
│ S3 Cloud Operations                 │  16  │  -   │  -   │
│ Weather API                         │  3   │  -   │  -   │
├─────────────────────────────────────┼──────┼──────┼──────┤
│ TOTAL                               │  52  │  -   │  1*  │
└─────────────────────────────────────┴──────┴──────┴──────┘

* Disease Detection test may skip if ML service is not running
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

---

## 🛠️ Environment Setup

### Required Environment Variables

```bash
# Weather API
WEATHER_API_KEY=your_openweathermap_api_key

# ML Microservice
DISEASE_DETECTION_URL=http://localhost:5000

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

- [ ] Read SERVICES_ARCHITECTURE.md
- [ ] Read TEST_MODULES_SUMMARY.md
- [ ] Run auth.test.js
- [ ] Run user.test.js
- [ ] Run plant.test.js
- [ ] Run disease-detection.test.js
- [ ] Run s3Cloud.test.js
- [ ] Run weather.test.js
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
Last Updated: May 16, 2026
