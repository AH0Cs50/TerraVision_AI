# Models — Schema Reference

## user.model.js — UserSchema

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "hashedpassword123",
  "role": "user",                          // "user" | "admin"
  "isVerified": false,                     // true | false
  "refreshToken": null,                    // string | null
  "emailToken": null,                      // string | null
  "location": {
    "city": "Cairo",                       // optional string
    "coordinates": {                       // optional
      "lat": 30.0444,                      // number
      "lon": 31.2357                       // number
    }
  }
}
```

---

## plant.model.js — PlantSchema

```json
{
  "userInternalId": 1712345678901,
  "name": "Tomato",

  "category": "crop",                      // "crop" | "tree" | "flower"
  "family": "fruiting_nightshade",         // "leafy_greens" | "fruiting_nightshade" | "succulent" | "root_crops" | "brassicas" | "legumes" | "herbs" | "tropical" | "citrus" | "vines" | "grasses" | "flowering_ornamentals"
  "growthStage": "flowering",              // "germination" | "seedling" | "vegetative" | "flowering" | "fruiting" | "mature"
  "plantedAt": "2026-03-15T00:00:00.000Z",
  "expectedHarvestDate": "2026-07-15T00:00:00.000Z",
  "soil": {
    "type": "sandy",                       // "sandy" | "alfisols" | "aridisols" | "entisols" | "inceptisols" | "vertisols"
    "moisture": 60                         // 0–100 (optional)
  },
  "watering": {
    "hoursSinceLastWatering": 12           // >= 0
  },
  "coverImage": "users/{uuid}/images/1740000000-tomato.jpg",  // S3 key for plant cover photo (optional)
  "disease": {
    "name": "healthy",                     // string (default "healthy")
    "confidence": 1,                       // 0–1
    "detectedAt": "2026-05-20T10:00:00.000Z"
  },
  "stress": {
    "diseaseType": "none",                 // "bacterial" | "fungal" | "none"
    "severity": "none"                     // "high" | "medium" | "none" (optional)
  },
  "diseaseHistory": [
    {
      "name": "early_blight",
      "confidence": 0.87,
      "detectedAt": "2026-04-10T08:30:00.000Z"
    }
  ],
  "cdn": {
    "basePath": "plants/user123/tomato",
    "images": ["img1.jpg", "img2.jpg"]
  }
}
```

### Computed fields (added by Mongoose schema)

```json
{
  "internalId": 1712345678901,
  "uuid": "a1b2c3d4-...",
  "ageDays": 66,
  "hasDisease": false,
  "createdAt": "2026-05-20T10:00:00.000Z",
  "updatedAt": "2026-05-20T10:00:00.000Z"
}
```

---

## plant-care.model.js — PlantCareStateSchema

```json
{
  "plantUUID": "p1a2b3c4-...",            // links to plant.uuid
  "status": {
    "water": "satisfied",                  // "thirsty" | "low" | "satisfied" | "overwatered"
    "nutrients": "optimal",                // "needs_feed" | "low" | "optimal" | "excess"
    "health": "healthy",                   // "healthy" | "warning" | "diseased" | "critical"
    "light": "optimal"                     // "low" | "optimal" | "high" | "burn_risk"
  },
  "engineScores": {
    "waterScore": 1.5,                     // 0.5–2.0
    "fertilizerScore": 1.4,                // 0.5–2.0
    "pestRiskScore": 0.7,                  // 0.5–2.0
    "lightScore": 1.2,                     // 0.5–2.0
    "appliedRules": [
      {
        "id": "rule_water_01",
        "layer": "global",                 // string
        "explainKey": "base_water_ok"      // string
      }
    ]
  },
  "activeTasks": [
    {
      "taskId": "t1b2c3d4-...",
      "type": "watering",                  // "watering" | "fertilizing" | "pruning" | "disease_treatment" | "move_light" | "harvest"
      "title": "Water the tomato plant",
      "description": "Soil moisture is low, give 500ml",
      "priority": "medium",                // "low" | "medium" | "high"
      "status": "pending",                 // "pending" | "in_progress" | "completed" | "cancelled"
      "generatedBy": "system",             // "ai" | "system" | "user"
      "createdAt": "2026-05-20T10:00:00.000Z",
      "dueDate": "2026-05-21T08:00:00.000Z",
      "completedAt": null
    }
  ],
  "completedTasks": [
    {
      "taskId": "t5e6f7g8-...",
      "type": "fertilizing",
      "title": "Fertilize tomato plant",
      "priority": "medium",
      "status": "completed",               // always "completed" when in this array
      "generatedBy": "ai",
      "createdAt": "2026-05-18T10:00:00.000Z",
      "dueDate": "2026-05-19T08:00:00.000Z",
      "completedAt": "2026-05-19T07:30:00.000Z"
    }
  ],
  "actionLogs": [
    {
      "logId": "l1a2b3c4-...",
      "actionType": "watered",             // "watered" | "fertilized" | "disease_scan" | "task_completed" | "light_changed" | "harvested"
      "description": "Watered 500ml at 8am",
      "metadata": { "source": "manual" },  // optional, any object
      "createdAt": "2026-05-20T08:00:00.000Z"
    }
  ],
  "aiInsights": {
    "summary": "Plant is healthy, maintain current watering schedule.",
    "recommendations": [
      "Water every 2 days",
      "Check for pests weekly"
    ],
    "generatedAt": "2026-05-20T10:30:00.000Z"
  },
  "updatedAt": "2026-05-20T10:30:00.000Z"
}

### Computed fields (added by `createPlantCareStateModel`)

```json
{
  "internalId": 1712345678901,
  "uuid": "770e8400-...",
  "createdAt": "2026-05-20T10:00:00.000Z"
}
```

---

## action-log.model.js — ActionLogSchema

```json
{
  "logId": "l1a2b3c4-...",
  "plantUUID": "p1a2b3c4-...",
  "plantInternalId": 1712345678901,
  "userUUID": "u1a2b3c4-...",
  "userInternalId": 1712345678901,
  "actionType": "watered",
  "description": "Watered 500ml at 8am",
  "metadata": { "source": "manual" },
  "createdAt": "2026-05-20T08:00:00.000Z"
}
```

---

## Enums Reference

### `WATER_STATUSES`
`["thirsty", "low", "satisfied", "overwatered"]`

### `NUTRIENT_STATUSES`
`["needs_feed", "low", "optimal", "excess"]`

### `HEALTH_STATUSES`
`["healthy", "warning", "diseased", "critical"]`

### `LIGHT_STATUSES`
`["low", "optimal", "high", "burn_risk"]`

### `TASK_TYPES`
`["watering", "fertilizing", "pruning", "disease_treatment", "move_light", "harvest"]`

### `TASK_PRIORITIES`
`["low", "medium", "high"]`

### `TASK_STATUSES`
`["pending", "in_progress", "completed", "cancelled"]`

### `TASK_GENERATED_BY`
`["ai", "system", "user"]`

### `ACTION_TYPES`
`["watered", "fertilized", "disease_scan", "disease_detected", "task_completed", "task_added", "task_updated", "task_cancelled", "light_changed", "harvested", "plant_created", "plant_updated", "plant_deleted", "image_uploaded", "image_removed", "plant_data_extracted", "insight_generated"]`

---

### Score → Status Mapping

| Score Range | Water         | Nutrients    | Health     | Light       |
| ----------- | ------------- | ------------ | ---------- | ----------- |
| ≥ 1.7       | `thirsty`     | `excess`     | `critical` | `burn_risk` |
| 1.3 – 1.69  | `low`         | `optimal`    | `diseased` | `high`      |
| 0.8 – 1.29  | `satisfied`   | `low`        | `warning`  | `optimal`   |
| < 0.8       | `overwatered` | `needs_feed` | `healthy`  | `low`       |

---

## Utility Functions

### `engineScoresToStatus(scores)`
Maps numeric engine scores (0.5–2.0) to categorical status enums. Returns `{ water, nutrients, health, light }`.

### `buildEngineScores(engineResult)`
Normalizes engine output for persistence. Strips `_appliedRules` and restructures as `{ waterScore, fertilizerScore, pestRiskScore, lightScore, appliedRules }`.

### `createPlantCareStateModel(data)`
Factory for new care state documents. Generates `internalId`, `uuid`, `createdAt`, `updatedAt`. Wraps tasks with createPlantTaskModel-like logic.

### `createPlantTaskModel(data)`
Factory for task objects. Validates `type` against `TASK_TYPES`, defaults `priority` to `"medium"`, `status` to `"pending"`, `generatedBy` to `"ai"`.