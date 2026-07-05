# API Documentation — Dashboard Module

Base URL: `/api/v1/dashboard`

Auth: All endpoints require `Authorization: Bearer <accessToken>`.

---

### GET `/` (Full Dashboard)

**Purpose:** Aggregate all dashboard sections into one response: plant statistics, care status distribution, resource demand, task efficiency, upcoming harvests, AI farm report, and recent activity logs.

**Flow:** Resolves user by UUID → fetches all plants → aggregates stats, care distribution, resource demand, task efficiency, upcoming harvests → generates AI farm report via Gemini → fetches last 10 action logs.

**Use Case:** `DashboardUseCases.getUserDashboard(user)` → `dashboardService.getUserStats()` → `plantCareAiInsights.generateFarmReport()`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Dashboard data retrieved successfully",
  "data": {
    "totalPlants": 12,
    "diseasedPlants": 2,
    "healthyPlants": 10,
    "plantsByCategory": { "crop": 5, "tree": 3, "flower": 4 },
    "plantsByGrowthStage": {
      "germination": 1, "seedling": 2, "vegetative": 4,
      "flowering": 3, "fruiting": 1, "mature": 1
    },
    "careStatusDistribution": {
      "water": { "thirsty": 1, "low": 2, "satisfied": 7, "overwatered": 0 },
      "nutrients": { "needs_feed": 1, "low": 2, "optimal": 7, "excess": 0 },
      "health": { "healthy": 8, "warning": 1, "diseased": 2, "critical": 0 },
      "light": { "low": 1, "optimal": 9, "high": 0, "burn_risk": 0 }
    },
    "healthPercentages": { "healthy": 72.7, "warning": 9.1, "diseased": 18.2 },
    "resourceDemand": { "thirsty": 1, "needsFeed": 1, "lowLight": 1 },
    "taskEfficiency": {
      "activeTasks": 8, "completedTasks": 24, "totalTasks": 32, "efficiency": 75.0
    },
    "upcomingHarvests": [
      { "uuid": "plant-uuid-1", "name": "Tomato", "expectedHarvestDate": "2026-06-20T00:00:00.000Z", "daysUntilHarvest": 4 }
    ],
    "aiReport": {
      "summary": "Overall farm state is highly optimized...",
      "recommendations": [
        "Adjust irrigation for thirsty plants by +15%",
        "Schedule fertilization for plants flagged as needs_feed"
      ]
    },
    "recentActivity": [
      {
        "logId": "log-uuid",
        "actionType": "watered",
        "description": "Plant watered",
        "plantUUID": "plant-uuid-1",
        "createdAt": "2026-06-15T12:00:00.000Z"
      }
    ]
  }
}
```

---

### GET `/stats`

**Purpose:** Lightweight plant statistics. Hits only the plant repository — does not fetch care states or action logs.

**Use Case:** `DashboardUseCases.getUserStats(user)` → `dashboardService.getPlantStats()`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Plant statistics retrieved successfully",
  "data": {
    "totalPlants": 12,
    "diseasedPlants": 2,
    "healthyPlants": 10,
    "plantsByCategory": { "crop": 5, "tree": 3, "flower": 4 },
    "plantsByGrowthStage": {
      "germination": 1, "seedling": 2, "vegetative": 4,
      "flowering": 3, "fruiting": 1, "mature": 1
    }
  }
}
```

---

### GET `/care`

**Purpose:** Care status distribution across all user's plants and health percentage breakdown. Fetches both plants and their care state documents.

**Use Case:** `DashboardUseCases.getUserCareDistribution(user)` → `dashboardService.getCareDistribution()`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Care distribution retrieved successfully",
  "data": {
    "careStatusDistribution": {
      "water": { "thirsty": 1, "low": 2, "satisfied": 7, "overwatered": 0 },
      "nutrients": { "needs_feed": 1, "low": 2, "optimal": 7, "excess": 0 },
      "health": { "healthy": 8, "warning": 1, "diseased": 2, "critical": 0 },
      "light": { "low": 1, "optimal": 9, "high": 0, "burn_risk": 0 }
    },
    "healthPercentages": { "healthy": 72.7, "warning": 9.1, "diseased": 18.2 }
  }
}
```

---

### GET `/resource-demand`

**Purpose:** Counts of plants requiring immediate attention per category.

**Use Case:** `DashboardUseCases.getUserResourceDemand(user)` → `dashboardService.getResourceDemand()`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Resource demand retrieved successfully",
  "data": {
    "resourceDemand": { "thirsty": 1, "needsFeed": 1, "lowLight": 1 }
  }
}
```

**Resource Demand Mapping:**
| Field | Source Status | Condition |
|-------|---------------|-----------|
| `thirsty` | `status.water === "thirsty"` | Plant needs immediate watering |
| `needsFeed` | `status.nutrients === "needs_feed"` | Plant needs immediate fertilization |
| `lowLight` | `status.light === "low"` | Plant needs more light |

---

### GET `/task-efficiency`

**Purpose:** Task efficiency metrics across all plants. Active vs completed task counts and efficiency percentage.

**Use Case:** `DashboardUseCases.getUserTaskEfficiency(user)` → `dashboardService.getTaskEfficiency()`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Task efficiency retrieved successfully",
  "data": {
    "taskEfficiency": {
      "activeTasks": 8,
      "completedTasks": 24,
      "totalTasks": 32,
      "efficiency": 75.0
    }
  }
}
```

**Formula:** `efficiency = (completedTasks / totalTasks) × 100`, clamped to 100% if no tasks exist.

---

### GET `/harvests`

**Purpose:** Upcoming harvest dates sorted ascending. Supports `?limit=N` to control how many to return.

**Query Parameters:**
| Param | Type | Default | Max | Description |
|-------|------|---------|-----|-------------|
| `limit` | number | 3 | 20 | Number of upcoming harvests to return |

**Use Case:** `DashboardUseCases.getUserUpcomingHarvests(user, last)` → `dashboardService.getUpcomingHarvests()`

**Example:** `GET /api/v1/dashboard/harvests?limit=5`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Upcoming harvests retrieved successfully",
  "data": {
    "upcomingHarvests": [
      {
        "uuid": "plant-uuid-1",
        "name": "Tomato",
        "expectedHarvestDate": "2026-06-20T00:00:00.000Z",
        "daysUntilHarvest": 4
      },
      {
        "uuid": "plant-uuid-2",
        "name": "Lettuce",
        "expectedHarvestDate": "2026-06-25T00:00:00.000Z",
        "daysUntilHarvest": 9
      }
    ]
  }
}
```

---

### GET `/ai-report`

**Purpose:** Generate an AI-powered Executive Farm Report using Google Gemini. Takes current dashboard statistics and produces a natural-language system evaluation with critical recommendations.

**Flow:** Resolve user → get stats → `plantCareAiInsights.generateFarmReport(stats)` → Gemini LLM → returns summary + recommendations.

**Use Case:** `DashboardUseCases.getUserAiReport(user)` → `plantCareAiInsights.generateFarmReport()`

**LLM Fallback:** If Gemini is unavailable, returns empty summary and empty recommendations array.

**Success Response (200):**
```json
{
  "success": true,
  "message": "AI farm report retrieved successfully",
  "data": {
    "aiReport": {
      "summary": "Overall farm state is highly optimized. The 7-layer engine has cross-referenced 131 environmental factors with live weather data. Nightshade families show ideal metabolic rates, though pest-risk vigilance is advised due to current 58% ambient moisture triggers.",
      "recommendations": [
        "Adjust irrigation for thirsty plants by +15% to compensate for increased UV intensity",
        "Schedule fertilization for plants flagged as needs_feed",
        "Monitor low-light plants — consider repositioning or supplemental lighting"
      ]
    }
  }
}
```

---

### GET `/weather`

**Purpose:** Get current weather for the user's location, including UV index. Resolves location from `user.location` (either `city` or `coordinates`).

**Use Case:** `DashboardUseCases.getUserWeather(user)` → `weatherService.getWeatherWithUV()`

**Flow:**
1. Resolve user location from `userRepo.findByUUID(uuid)`
2. Fetch current weather via OpenWeatherMap `weather` endpoint
3. Fetch UV index via OpenWeatherMap `uvi` endpoint (separate call, non-blocking — returns `null` on failure)
4. Return merged result

**Success Response (200):**
```json
{
  "success": true,
  "message": "Weather retrieved successfully",
  "data": {
    "location": { "city": "Cairo", "lat": 30.0444, "lon": 31.2357 },
    "temperature": 32.5,
    "feelsLike": 34.1,
    "humidity": 45,
    "pressure": 1013,
    "description": "clear sky",
    "icon": "01d",
    "windSpeed": 3.6,
    "clouds": 5,
    "uvIndex": 7.2,
    "lastUpdated": "2026-07-02T10:00:00.000Z"
  }
}
```

UV index falls back to `null` if the API plan doesn't support it.

---

### GET `/activity`

**Purpose:** Most recent action logs across all user's plants, sorted by creation date (newest first).

**Query Parameters:**
| Param | Type | Default | Max | Description |
|-------|------|---------|-----|-------------|
| `last` | number | 10 | 100 | Number of recent logs to return |

**Use Case:** `DashboardUseCases.getUserRecentActivity(user, last)` → `actionLogRepo.findByUserUUID()`

**Example:** `GET /api/v1/dashboard/activity?last=5`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Recent activity retrieved successfully",
  "data": {
    "logs": [
      {
        "logId": "log-uuid-1",
        "actionType": "watered",
        "description": "Plant watered",
        "plantUUID": "plant-uuid-1",
        "userUUID": "user-uuid",
        "createdAt": "2026-06-15T12:00:00.000Z"
      },
      {
        "logId": "log-uuid-2",
        "actionType": "fertilized",
        "description": "Plant fertilized",
        "plantUUID": "plant-uuid-2",
        "userUUID": "user-uuid",
        "createdAt": "2026-06-15T10:30:00.000Z"
      }
    ]
  }
}
```

---

### Response Trimming Reference

| Endpoint | Returns |
|----------|---------|
| `GET /` | Full aggregated object (all sections) |
| `GET /stats` | `{ totalPlants, diseasedPlants, healthyPlants, plantsByCategory, plantsByGrowthStage }` |
| `GET /care` | `{ careStatusDistribution, healthPercentages }` |
| `GET /resource-demand` | `{ resourceDemand }` |
| `GET /task-efficiency` | `{ taskEfficiency }` |
| `GET /harvests` | `{ upcomingHarvests }` |
| `GET /ai-report` | `{ aiReport: { summary, recommendations } }` |
| `GET /weather` | `{ location, temperature, feelsLike, humidity, pressure, description, icon, windSpeed, clouds, uvIndex, lastUpdated }` |
| `GET /activity` | `{ logs }` |
