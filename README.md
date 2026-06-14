# TerraVision AI — Farming Assistant

Smart farming platform with AI disease detection, environmental analysis, and automated care recommendations.

## Getting Started

```bash
# Backend
cd Backend
npm install
cp config/config.env.example config/config.env   # add your keys
node app.js                                       # :5500

# ML service (optional)
cd Ml-service
pip install -r requirement.txt
uvicorn app.main:app --reload --port 8000          # :8000
```

Requires MongoDB running locally or remotely.

## Documentation

| Directory | Contents |
|-----------|----------|
| [`Backend/`](Backend/) | Node.js/Express API — architecture, setup, deployment ([README](Backend/README.md)), full API reference ([API.md](Backend/API.md)) |
| [`Ml-service/`](Ml-service/) | Python CNN ensemble model — architecture, endpoints, training ([README](Ml-service/README.md), [DOCS.md](Ml-service/DOCS.md)) |
| [`Frontend/`](Frontend/) | React 18 + Vite static prototype (Zustand, React Query) — UI mockups only, no API integration |
| [`Backend/service/engine/`](Backend/service/engine/) | Rule engine — 7-layer scoring system for water, fertilizer, pest, light ([README](Backend/service/engine/README.md)) |

## Usage

```http
# 1. Create a user
POST /api/v1/auth/signup
{"name": "Farmer Joe", "email": "joe@farm.com", "password": "secure123", "location": {"city": "Nairobi"}}

# 2. Add a plant with AI-assisted data extraction
POST /api/v1/plants/user/image/upload    {"fileName": "leaf.jpg", "fileType": "image/jpeg"}
PUT  <uploadUrl>                         # upload image binary directly to S3
POST /api/v1/plants/image/extract        {"key": "..."}        # extract plant data via Gemini
POST /api/v1/plants                      {"name": "Tomato", "category": "crop", ...}  # create plant

# 3. Quick disease detection (no plant required)
POST /api/v1/plants/user/image/upload    {"fileName": "leaf.jpg", "fileType": "image/jpeg"}
PUT  <uploadUrl>                         # upload image binary directly to S3
POST /api/v1/plants/user/image/detect    {"key": "..."}   # returns { disease, plant, confidence, ... }

# 4. Analyze and manage
POST /api/v1/plants/:id/analyze          # run rule engine
POST /api/v1/plants/:id/ai-insights      # get AI recommendations
```

## Contributing

See [`Backend/README.md`](Backend/README.md) for branch naming, commit conventions, and coding standards.
