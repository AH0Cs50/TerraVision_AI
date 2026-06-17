# 7. Security Architecture

## 7.1 Authentication Flow

TerraVision AI uses JWT-based authentication with access/refresh token rotation.

```
[Client]                         [Express API]                     [MongoDB]
    │                                  │                              │
    │  POST /auth/login                │                              │
    │  { email, password }             │                              │
    │ ──────────────────────────────►  │                              │
    │                                  │  userRepo.findByEmail()      │
    │                                  │ ──────────────────────────►  │
    │                                  │ ◄──────────────────────────  │
    │                                  │                              │
    │                                  │  passHasher.compare()        │
    │                                  │  (bcrypt, 12 rounds)         │
    │                                  │                              │
    │                                  │  tokenService:               │
    │                                  │  generateAccessToken() ── 15m│
    │                                  │  generateRefreshToken() ─ 7d │
    │                                  │                              │
    │                                  │  userRepo.updateRefreshToken│
    │                                  │ ──────────────────────────►  │
    │  { user, accessToken,            │                              │
    │    refreshToken }                │                              │
    │ ◄──────────────────────────────  │                              │
```

## 7.2 Token Specification

| Property | Access Token | Refresh Token |
|----------|-------------|---------------|
| Algorithm | HS256 | HS256 |
| Expiry | 15 minutes | 7 days |
| Secret | `ACCESS_TOKEN_SECRET` (32-char hex) | `REFRESH_TOKEN_SECRET` (32-char hex) |
| Payload | `{ uuid, email, role }` | `{ uuid, email, role }` (initial) / `{ uuid, role }` (on rotation) |
| Rotation | Not rotated | Rotated on each `POST /auth/refresh` |

Both secrets are static strings stored in `Backend/config/config.env` (no key rotation mechanism).

## 7.3 Token Refresh Flow

```
Client → POST /auth/refresh { refreshToken }
  → tokenService.verifyRefreshToken(refreshToken) → decode uuid
  → userRepo.findByUUID(uuid) → compare stored token === provided token
  → Generate NEW access + refresh token pair
  → userRepo.updateRefreshToken(internalId, newRefreshToken)
  → Return { accessToken, refreshToken }
```

**Key security properties:**
- Token rotation invalidates the old refresh token on each refresh
- Refresh tokens stored as **plaintext JWTs** in MongoDB (not hashed)
- Comparison is plaintext equality (`rawUser.refreshToken !== refreshToken`)
- On logout: stored refresh token is set to `null`

## 7.4 Protected Route Flow

```
Request with Authorization: Bearer <accessToken>
  → auth.middleware.authenticate()
    → Extract Bearer token from req.headers.authorization
    → tokenService.verifyAccessToken(token) → decoded { uuid, email, role }
    → req.user = decoded
    → next()
  → (optional) authorize("admin") role gate
  → Controller → Use Case → Response
```

**Error handling:**
| Scenario | Status | Message |
|----------|--------|---------|
| No `Authorization` header | 401 | "Unauthorized" |
| Invalid/malformed token | 401 | "Invalid token" |
| Expired token | 401 | "Access token expired" |
| Insufficient role | 403 | "Forbidden: insufficient permissions" |

## 7.5 Role-Based Access Control (RBAC)

Two roles: `"user"` and `"admin"`.

**`authorize(...roles)` middleware** — exported but **currently unused** in any route. All routes use only `authenticate` (JWT verification) without role gating.

**Self-or-admin pattern** (in `user.usecases.js`):
```javascript
if (user.uuid !== uuid && user.role !== "admin") {
  throw new RouteError(403, "Forbidden");
}
```

**Plant access control** (in `plant.service.js`):
- Owner sees their own plants
- Admin sees any plant
- Non-owner/non-admin gets 404 "Plant not found" (deliberately vague — avoids information leakage)

## 7.6 Password Security

| Property | Value |
|----------|-------|
| Algorithm | bcrypt |
| Salt rounds | 12 |
| Library | `bcrypt` v6.0.0 |
| Validation (Zod) | 8–64 chars, must contain uppercase + lowercase + digit |
| Storage | bcrypt hash only (plaintext never stored) |

## 7.7 Email Verification

| Property | Value |
|----------|-------|
| Token generation | `crypto.randomBytes(32).toString("hex")` (64 hex chars, 256 bits) |
| Storage | `User.emailToken` field |
| Expiry | None (no TTL on token) |
| Transport | Nodemailer via Gmail SMTP (STARTTLS on port 587) |
| Verification URL | `http://localhost:5500/api/auth/verify-email?token=<token>` |
| Send failure handling | Silently caught (empty catch block) — user can retry |

## 7.8 Response Sanitization

`HttpResponse.success()` automatically strips sensitive fields from all response data:

| Stripped Field | Reason |
|---------------|--------|
| `_id` | Internal MongoDB document ID |
| `__v` | MongoDB version key |
| `internalId` | Internal numeric FK — never exposed |
| `plantInternalId` | Internal plant FK |
| `userInternalId` | Internal user FK |
| `password` | Security — never expose hashes |
| `refreshToken` | Security — never expose stored tokens |

Additional behavior: ObjectId → string conversion, Buffer removal.

## 7.9 Error Handling

`RouteError` class (`Backend/shared/util/RouteError.js`):
```javascript
class RouteError extends Error {
  constructor(statusCode, message, details = null) {
    this.statusCode = statusCode;
    this.message = message;
    this.isOperational = true;  // distinguishes from programmer bugs
    this.details = details;
  }
}
```

**Error middleware** (`Backend/middlewares/error.middleware.js`):
| Error Type | HTTP Status | Response |
|-----------|-------------|----------|
| `TokenExpiredError` | 401 | `"Access token expired"` |
| `JsonWebTokenError` | 401 | `"Invalid token"` |
| `RouteError` | `err.statusCode` | `err.message` + optional `err.details` |
| Unknown errors | 500 | `"Internal Server Error"` |

**Note:** No `NODE_ENV` awareness — error responses are identical in all environments. Stack traces are never returned to the client (only logged server-side).

## 7.10 S3 / File Upload Security

| Property | Value |
|----------|-------|
| Upload pattern | Pre-signed PUT URLs (client uploads directly, no file buffers through Node) |
| URL expiry | 300 seconds (5 minutes, configurable via `SignedUrlExpiresIn`) |
| Allowed MIME types | `image/jpeg`, `image/png`, `image/webp` |
| Key validation | Regex: `plants/{userId}/{plantId}/images/{timestamp}-{safeName}` |
| Image path convention | `plants/{userId}/{plantId}/images/{timestamp}-{sanitizedName}` |
| Filename sanitization | Strip non-alphanumeric chars, collapse hyphens, lowercase |
| Deletion handling | Non-fatal — failures are logged but never thrown |
| S3 health check | `HeadBucketCommand` before every operation |

## 7.11 API Key / Secrets Management

| Secret | Storage | Risk |
|--------|---------|------|
| JWT secrets | `config.env` (plaintext) | If leaked, tokens can be forged |
| Storj S3 credentials | `config.env` (plaintext) | If leaked, bucket accessible |
| Gemini API key | `config.env` (plaintext) | If leaked, AI quota consumed |
| OpenWeatherMap API key | `config.env` (plaintext) | If leaked, API quota consumed |
| SMTP password | `config.env` (plaintext) | If leaked, email account compromised |

**All secrets are in a single `.env` file** — this file is gitignored but contains what appear to be real credentials.

## 7.12 Observability & Security Gaps

| Gap | Impact | Severity |
|-----|--------|----------|
| No CORS headers configured | Cross-origin browser requests blocked | Medium |
| No rate limiting | Brute force / DoS possible | High |
| No Helmet security headers | Missing X-Content-Type-Options, CSP, etc. | Medium |
| Refresh tokens stored as plaintext | DB read access → token theft | High |
| No correlation/request ID | Difficult to trace requests across logs | Low |
| Zod validation errors → 500 | Email validation failures misreported | Medium |
| `authorize` middleware unused | RBAC disabled in all routes | High |
| `isOperational` flag dead code | Not read by error handler | Low |
| No NODE_ENV awareness | Same error responses dev vs prod | Low |
| config.env tracked with live keys | Credentials in repository | **Critical** |
| No soft-delete | Data loss on delete | Medium |
| No request logging middleware | No audit trail for requests | Medium |
