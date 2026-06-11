## Goal
- Fix `_id` leaking MongoDB internal buffer, fix `expectedHarvestDate` null, add `_id` to sensitive keys.
- Add Gemini model fallback priority (2.5 → 2.0 → 1.5 flash) with retry logic.
- Strip markdown fences from LLM responses, fix `InternalServerError` enum casing bugs.
- Add ML service `success===false` guard in disease detection; Python response adaptation.
- Trim controller responses to action-specific data (no full documents).
- Document compaction rule in AGENTS.md.

## Constraints & Preferences
- `_id` stripped globally via `HttpResponse.#sanitize`, not per-model.
- `expectedHarvestDate` must never be null when `plantedAt` is provided (fallback compute).
- Gemini models tried in descending power order (2.5 → 2.0 → 1.5 flash).
- JS adapts to Python ML service response shapes, not vice versa.
- Controllers return only the fields relevant to the action (no full docs).

## Progress
### Done
- **`HttpResponse.#sanitize` guard**: BSON ObjectId + Buffer detection to prevent `{buffer: {0:106,...}}` leakage.
- **`_id` stripped**: Added to sensitive keys set in `HttpResponse.#sanitize`.
- **`expectedHarvestDate` fallback**: Category-based compute in `plant.service.js` (crop:90d, flower:60d, tree:365d).
- **AGENTS.md rule**: Compaction documentation rule with simple/complex distinction.
- **Gemini model fallback**: `MODEL_PRIORITY` array [2.5, 2.0, 1.5 flash] with `#generateWithFallback` + `#isRetryableError` (429/503).
- **Markdown fence stripping**: `#processResponse` strips ```json fences before JSON.parse.
- **Enum casing fix**: `InternalServerError` → `INTERNAL_SERVER_ERROR` in 3 locations.
- **`SERVICE_UNAVAILABLE:503`**: Added to `HttpStatusCodes.js`.
- **Error handler guard**: `Number.isInteger(err.statusCode)` defaults to 500 on missing status.
- **ML service `success===false` guard**: `detectDisease`/`detectGeneralDisease` check `response.data?.success` and return healthy fallback.
- **`#transformMlResponse` guard**: Returns healthy fallback when `prediction` is undefined.
- **Controller response trimming**:
  - `detectPlantDisease`: returns `{ disease, diseaseHistory }` instead of full Plant doc.
  - `analyzePlant`: returns `{ status }` sub-schema instead of full PlantCare doc.
  - `addTask`: returns `activeTasks` array instead of full state.
  - `completeTask`: returns `{ task, activeTasks, completedTasks }`.
  - `cancelTask`: returns `{ task, activeTasks }`.
  - `reopenTask`: returns `{ task, activeTasks, completedTasks }`.
  - `generateTasks`: returns `{ tasks, status }`.
  - `removeCompletedTasks`: returns `{ completedTasks }`.
- **Logger description param**: All `plantCareActionLogger` calls now pass `description` string as 3rd arg.

### In Progress
- (none)

### Blocked
- (none)

## Key Decisions
- BSON ObjectId detected via `_bsontype` property to avoid cross‑module `instanceof` issues.
- Gemini fallback order: most powerful first (2.5 → 2.0 → 1.5 flash), degrading on 429/503 only.
- PlantTaskCareManager methods return structured objects, not full care state docs.
- Controllers destructure only what the client needs for the specific action.
- JS disease‑detection service mirrors Python's `success: false` response pattern.

## Next Steps
- Verify frontend/API consumers don't depend on `_id` in responses.
- Monitor Gemini model availability across all three tiers.
- Test controller response trimming with existing frontend.

## Critical Context
- `HttpResponse.#sanitize` iterates `Object.entries(obj)` recursively. BSON ObjectIds have an enumerable `buffer` property that leaked raw bytes without the guard.
- `InternalServerError` (PascalCase) vs `INTERNAL_SERVER_ERROR` (SCREAMING_SNAKE) — HttpStatusCodes uses the latter. This caused `statusCode: undefined` in 3 RouteError throws.
- The Python ML service returns 200 with `{success: false}` on internal errors (no `prediction` field). Both `detectDisease`/`detectGeneralDisease` now handle this.
- Model fallback catches 429 (quota) and 503 (overloaded) only. Auth errors (401 etc.) are thrown immediately.
- `#processResponse` strips ``` fences because Gemini sometimes wraps JSON in markdown code blocks.
- PlantTaskCareManager methods now return `{ task, activeTasks, completedTasks }` etc. instead of full care state — any direct caller outside the two controllers would break (none exist).
- Logger `description` param was missing (only 2 args passed) — now all calls pass 3 args with a description string.

## Relevant Files
- `Backend/shared/util/HttpResponse.js`: ObjectId/Buffer guard + `_id` in sensitive keys.
- `Backend/shared/util/HttpStatusCodes.js`: Added `SERVICE_UNAVAILABLE:503`.
- `Backend/service/llm.service.js`: Model fallback, markdown stripping, enum fix.
- `Backend/service/plant.service.js`: `expectedHarvestDate` fallback compute.
- `Backend/service/disease-detection.service.js`: `success===false` guard, `#transformMlResponse` guard.
- `Backend/service/plant-care-state.service.js`: 6 PlantTaskCareManager method returns restructured.
- `Backend/controller/plant.controller.js`: `detectPlantDisease` response trimmed.
- `Backend/controller/plant-care.controller.js`: 3 handler responses trimmed + logger description fix.
- `Backend/middlewares/error.middleware.js`: `Number.isInteger` status code guard.
- `Backend/AGENTS.md`: Compaction documentation rule.

## Changelog

| Commit | Message | Scope |
|---|---|---|
| `541fd57` | docs: update Backend README with latest features | Backend/README.md |
| `c3c90d9` | fix: add HttpResponse sanitization, harvestDate fallback, error handler guard, test files | HttpResponse.js, plant.service.js, error.middleware.js, agnostic test files |
| `396dfc6` | feat: add Gemini model fallback with retry logic and fix enum casing | llm.service.js, HttpStatusCodes.js |
| `ffa8593` | fix: adapt disease detection to Python `success: false` response pattern | disease-detection.service.js |
| `b9ac297` | refactor: trim controller responses + restructure PlantTaskCareManager returns | plant-care.controller.js, plant.controller.js, plant-care-state.service.js |

---

## Constraints & Preferences
- Action logs stored as independent documents (one per action) in a separate `ActionLog` model, not embedded in the plant care state.
- `ACTION_TYPES` enum moved to `action-log.model.js`; re-exported from `plant-care.model.js` for backward compat.
- Each action log stores both UUIDs (`plantUUID`, `userUUID`) for the API boundary and internal IDs (`plantInternalId`, `userInternalId`) for indexed relational queries.
- `internalId` is **not** added to the JWT payload (avoids leaking sequential integers); resolved on-demand via `plantService.getInternalId()` and the `userService` instance held by the logger.
- Logger methods accept `user` object `{ uuid, internalId? }` instead of a plain UUID.
- Mutating controller actions **log only** (no auto-task-creation).
- `getLogsByType` merged into `GET /:id/logs` via `?type=` query param.
- Care state is **not** eagerly created at plant creation time (only created by `saveEngineOutput` on first analysis).
- `pushActionLog` auto-creation safety net removed — action logs are fully independent of the care state.

## Progress
### Done
- **Service comments**: JSDoc added to all 13 service files (class `@description`, method `@param`/`@returns`/`@throws` for every method).
- **Repository comments**: JSDoc added to all 4 repository files (same pattern).
- **Action Log model** (`model/action-log.model.js`): new schema with `logId`, `plantUUID`, `plantInternalId`, `userUUID`, `userInternalId`, `actionType`, `description`, `metadata`, `createdAt`. Indexes on `(plantInternalId, createdAt)` and `(userInternalId, createdAt)` and `(plantUUID, createdAt)`.
- **Action Log repository** (`repositories/action-log.repository.js`): `create`, `findByPlantUUID` (paginated), `findByPlantInternalId`, `findByUserUUID`, `findByType`, `getRecent`, `countByPlantUUID`, `deleteByPlantUUID`, `deleteOlderThan`.
- **PlantCareModel cleanup** (`model/plant-care.model.js`): removed `actionLogs` field, removed `actionLogSubSchema`, `ACTION_TYPES` now re-exported from `action-log.model.js`.
- **PlantCareRepository cleanup** (`repositories/plant-care.repository.js`): removed `pushActionLog`, `paginateActionLogs`.
- **PlantService** (`service/plant.service.js`): reverted eager care-state creation; added `getInternalId(plantUUID)` method.
- **PlantCareActionLogger refactor** (`service/plant-care-state.service.js`): constructor now accepts `(actionLogRepo, plantService)`; all methods resolve `plantInternalId` via `plantService.getInternalId()` and `userInternalId` via `#resolveUserInternalId()`; query methods delegate to `actionLogRepo` directly.
- **Container wiring** (`shared/container.js`): `actionLogRepo` added; `PlantCareActionLogger` wired with `actionLogRepo` and `plantService`; `PlantService` reverted to 4-param constructor.
- **Controller logging** (`controller/plant.controller.js`): all 7 mutating handlers log via `plantCareActionLogger` with `req.user` object; `deletePlant` also calls `actionLogRepo.deleteByPlantUUID(id)`.
- **Controller refactor** (`controller/plant-care.controller.js`): `getLogs` extended with `?type=`, `?page=&limit=`, `?last=`; 13 new handler functions added (`waterPlant`, `fertilizePlant`, `harvestPlant`, `updateLight`, `cancelTask`, `reopenTask`, `generateTasks`, `getOverdueTasks`, `getPendingTasks`, `getPrioritizedTasks`, `removeCompletedTasks`, `clearOldLogs`, `askQuestion`); `addTask` and `generateAiInsights` now log.
- **Route registration** (`routes/plant-care.route.js`): 21 routes total — literal paths before parameterized.
- `ACTION_TYPES` extended with `disease_detected`, `plant_created`, `plant_updated`, `plant_deleted`, `image_uploaded`, `image_removed`, `plant_data_extracted`, `insight_generated`.
- **User param wiring** (`controller/plant.controller.js`, `controller/plant-care.controller.js`, `service/plant-care-state.service.js`): all logger calls and task manager methods updated to pass `req.user` object instead of bare UUID; `PlantTaskCareManager.completeTask`, `cancelTask`, `reopenTask`, `generateTasksFromStatus`, `removeCompletedTasks` all accept optional `user` param.

### In Progress
- (none)

### Blocked
- (none)

## Key Decisions
- Independent ActionLog collection avoids 16MB document ceiling, race conditions on concurrent writes, and enables fast indexed queries without in-memory filtering.
- `internalId` **not** added to JWT — sequential integer leak is a security concern; resolved on-demand in the logger via two indexed queries per write.
- Storing both UUIDs and internalIds on each log gives zero-lookup reading at query time.
- Logger requires `user` object `{ uuid, internalId? }` — controllers always pass `req.user` (from auth middleware), carrying `uuid` from the JWT.

## Next Steps
- Test: verify `actionLogRepo.create()` works end-to-end on a create-plant → upload-photo → detect-disease flow.
- Verify that all existing `plant-care` tests (if any) still pass after the removal of embedded `actionLogs`.

## Critical Context
- The `PlantCareActionLogger` constructor changed from `(plantCareStateRepo)` to `(actionLogRepo, plantService)` — any code outside the container that instantiated it directly is now broken.
- The `logWatering`, `logFertilizing`, `logHarvest`, `logLightChanged` methods were previously dead code (no callers); they are now called by the new route handlers.
- `getRecentLogs` behavior changed: it now returns `cursor.limit(last)` sorted `createdAt: -1` (newest first) instead of `array.slice(-last)` (oldest last). Verify the frontend or API consumers expect newest-first ordering.
- All logger convenience methods now require `user` as second parameter — any existing callers (e.g. inside `PlantTaskCareManager` methods) must be updated to pass a user object.
- `clearOldLogs` controller checks `if (!result)` — but `actionLogRepo.deleteOlderThan` returns a number (0 if none deleted), and `0` is falsy, so it would incorrectly return "Care state not found" when no logs were old enough. Needs fixing.

## Relevant Files
- `model/action-log.model.js`: new independent action log schema.
- `repositories/action-log.repository.js`: all action log CRUD + queries.
- `model/plant-care.model.js`: `actionLogs` field removed.
- `repositories/plant-care.repository.js`: `pushActionLog`, `paginateActionLogs` removed.
- `service/plant.service.js:288-296`: `getInternalId()` method.
- `service/plant-care-state.service.js:329-604`: refactored `PlantCareActionLogger` class.
- `shared/container.js:10,48-49,57`: wiring for `actionLogRepo` and new logger.
- `controller/plant.controller.js:55,83,106,126,150,172,207,324-325`: all log calls + `actionLogRepo.deleteByPlantUUID`.
- `controller/plant-care.controller.js`: 13 new handlers + extended `getLogs` + `actionLogRepo` usage in `generateAiInsights`/`askQuestion`.
- `routes/plant-care.route.js`: 21 routes total.

## Changelog

| Commit | Message | Scope |
|---|---|---|
| `9b9828e` | feat: add action logging system with related services and docs | 21 files — ActionLog model/repo, plant-care model/repo/service, controllers, routes, container, middleware, app, s3Cloud, disease-detection, plant-analyser, llm, plant.service + JSDoc |
| `66288c5` | feat: add plant-vision service with LLM extraction and docs | 1 file — new `plant-vision.service.js` (66 lines, Gemini-based image extraction) |
| `dacb2f4` | fix: update ML service, tests, and config | 14 files — Ml-service improvements, test updates, package.json bumps |
| `4305975` | docs: annotate services and repositories | 8 files — pure JSDoc on auth, user, weather, email, passHash, token services + user/plant repositories |
