# TerraVision AI — System Documentation

## Overview

TerraVision AI is an AI-powered farming assistant composed of a Node.js/Express API backend and a Python FastAPI ML microservice. This documentation covers both services.

## Documentation Index

| # | Document | Description |
|---|----------|-------------|
| 1 | [Executive Summary](01-executive-summary.md) | System purpose, capabilities, stakeholders, scope |
| 2 | [Repository Overview](02-repository-overview.md) | Project structure, tech stack, dependencies, build system |
| 3 | [C4 Architecture](03-c4-architecture.md) | System Context, Container, Component, and Code-Level views with diagrams |
| 4 | [UML Diagrams](04-uml-diagrams.md) | Use case, sequence, state machine, and class diagrams |
| 5a | [API — Auth Module](api/05-auth.md) | `/api/v1/auth` — signup, login, refresh, logout |
| 5b | [API — User Module](api/05-users.md) | `/api/v1/users` — profile CRUD, email verification |
| 5c | [API — Plant & Plant Care Module](api/05-plants.md) | `/api/v1/plants` — CRUD, care actions, tasks, insights |
| 5d | [API — Disease Detection & ML Service](api/05-disease-and-ml.md) | Disease detection endpoints, ML `/predict` |
| 5e | [API — Dashboard Module](api/05-dashboard.md) | `/api/v1/dashboard` — stats, care, tasks, harvests, AI report, activity |
| 5f | [API — Workflows & Route Sequences](api/05-workflows.md) | Complete user journey workflows — how routes connect across modules |
| 6 | [Data Architecture](06-data-architecture.md) | MongoDB schemas, relationships, enums, DTOs |
| 7 | [Security Architecture](07-security-architecture.md) | Auth flow, JWT, RBAC, encryption, vulnerabilities |

## Quick Reference

### Key Ports
| Service | Port |
|---------|------|
| Express API | 5500 |
| ML Service | 8000 |
| MongoDB | 27017 |

### Key Paths
| Path | Description |
|------|-------------|
| `Backend/` | Node.js/Express (ESM) |
| `Backend/app.js` | Entry point, middleware chain |
| `Backend/shared/container.js` | DI container wiring |
| `Backend/usecases/` | All business logic (8 files) |
| `Backend/entity/` | Entity classes with delta methods |
| `Backend/model/` | Mongoose schemas (4 collections) |
| `Backend/infrastructure/service/` | Token, bcrypt, S3, LLM services |
| `Backend/service/engine/` | 7-layer rule engine (131 rules) |
| `Ml-service/` | Python FastAPI ML service |
| `Ml-service/app/model.py` | CNN ensemble (3 models, 88 classes) |

### Key Commands
```bash
# Backend
cd Backend && npm install && node app.js
npx nodemon app.js

# ML Service
cd Ml-service && pip install -r requirement.txt
uvicorn app.main:app --reload --port 8000

# Tests
node test/service/<name>.usecase.test.js

# Lint
npx eslint Backend/
```

## Conventions

- **Tags in docs**: `[Verified]` — confirmed by code, `[Inferred]` — based on evidence, `[Unknown]` — not confirmed
- **All code references** include file paths relative to repo root
- **Mermaid diagrams** are embedded in markdown files

## Known Gaps

- Frontend is a static prototype with zero API integration (not documented)
- No CI/CD pipeline or Dockerfiles in production use
- Rate limiting, caching, and background job queues are not implemented
- Refresh tokens stored as plaintext in MongoDB
- CORS headers not configured
