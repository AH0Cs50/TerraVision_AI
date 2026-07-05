# 1. Executive Summary

TerraVision AI is an AI-powered farming assistant that helps users monitor, analyze, and care for their plants. It combines a modular Node.js/Express backend with a Python FastAPI ML microservice to deliver disease detection, personalized care recommendations, automated task management, and AI-driven insights.

**System Name:** farming_assistant (package.json)

**Technology Stack:**
- **Backend:** Node.js (Express 5.2.1, ESM), Mongoose 9, Zod 4, JWT 9, bcrypt 6
- **ML Service:** Python (FastAPI), TensorFlow 2.16.1, Keras 3.12
- **Database:** MongoDB (terra_db on 127.0.0.1:27017)
- **Storage:** Storj S3-compatible object storage (pre-signed PUT URLs, no file buffers through Node)
- **AI:** Google Gemini API with model fallback chain: gemini-2.5-flash → gemini-2.0-flash → gemini-1.5-flash

**Core Capabilities:**

1. **User Management & Auth** — JWT-based authentication with access (15m) and refresh (7d, rotated on use) tokens. Email verification, role-based authorization (user/admin), bcrypt 12 password hashing, change-password with session invalidation.

2. **Plant Management** — Full CRUD with growth stage classification (germination, seedling, vegetative, flowering, fruiting, mature), harvest date derivation via LLM, plant family categorization across 12 families, and optional cover image (S3 key → pre-signed URL on retrieval).

3. **Disease Detection** — Three-model CNN ensemble (EfficientNetV2B0 0.2 + ResNet101V2 0.3 + MobileNetV2 0.5) classifying 88 plant-disease classes. Fallback to "healthy" with 1.0 confidence on any failure. Accessed via `POST /predict` endpoints.

4. **Rule Engine** — 131 rules across 7 layers (Global, Soil, Plant Family, Growth Stage, Watering History, Pest/Disease, Light) producing 4 normalized scores (0.5–2.0): water, fertilizer, pest risk, and light.

5. **Plant Care Actions** — Watering, fertilizing, pruning, harvesting, disease treatment, and light adjustment. All mutations flow through entity methods that return deltas applied to the database.

6. **Task Generation** — Automated task creation and prioritization combining AI (Gemini) and system rules.

7. **AI Insights & Q&A** — Gemini-powered chat and analytics, with markdown fences stripped from JSON responses.

8. **Dashboard** — Statistics, care distribution charts, task efficiency metrics, harvest tracking, and weather data (temperature, humidity, UV index) based on user location.

**Architecture:** Modular monolith (Backend) communicating with an ML microservice via HTTP. The backend follows a use case–driven design: controllers delegate to use cases, which contain all business logic and throw `RouteError` on failure. A dependency injection container (`shared/container.js`) wires repositories, services, and entities. All Plant data mutations go through entity methods that produce deltas (e.g., `plant.applyWatering(0)` → `{ "watering.hoursSinceLastWatering": 0 }`), which are persisted via `plantRepo.updateByUUID()`.

**Modules:** Auth, User, Plant, Plant Care, Dashboard, ML Disease Detection.

**Stakeholders:** Home gardeners, small-scale farmers, and agricultural hobbyists seeking data-driven plant care.
