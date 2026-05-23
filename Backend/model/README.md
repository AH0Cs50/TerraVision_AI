# Models — Temp Objects

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
  "varietyName": "Cherry Roma",
  "plantType": "crop",                     // "crop" | "tree"
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

### Computed fields (added by `createPlantModel`)

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

## plant_analysis.model.js — PlantCareStateSchema

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
```
