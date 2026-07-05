# API Documentation — Auth Module

## Base URL: `/api/v1/auth`

### Common Response Envelope:
```json
// Success
{ "success": true, "message": "...", "data": {...}, "status": 200 }

// Error
{ "success": false, "message": "...", "status": 4xx }
```

### Common Error Responses

**400 — Validation Failure (Zod):**
```json
{
  "success": false,
  "message": "Validation failed",
  "status": 400,
  "details": [
    {
      "code": "invalid_type",
      "expected": "number",
      "received": "null",
      "path": ["soil", "moisture"],
      "message": "Expected number, received null"
    }
  ]
}
```

**400 — Invalid File Type:**
```json
{
  "success": false,
  "message": "Invalid file type. Allowed: image/jpeg, image/png, image/webp"
}
```

**401 — Unauthorized:**
```json
{ "success": false, "message": "Access token expired" }
```

**403 — Forbidden:**
```json
{ "success": false, "message": "Access denied. Insufficient permissions" }
```

**Common Status Codes:**

| Code | When |
|------|------|
| 400 | Validation failure, missing fields, invalid file type |
| 401 | Missing/invalid/expired JWT |
| 403 | Insufficient role permissions |
| 404 | Resource not found (plant, user, care state) |
| 409 | Duplicate email during signup |
| 500 | Unexpected internal errors |

### Authentication:
- JWT Bearer token in `Authorization: Bearer <token>` header
- `req.user` payload: `{ uuid: string, email: string, role: "user"|"admin" }`
- **Access token:** 15 minutes, signed with `JWT_SECRET`
- **Refresh token:** 7 days, stored as bcrypt hash in DB, rotated on each refresh (old token invalidated)
- `emailValidator` middleware (applied to `/login`) validates `req.body.email` via Zod email schema
- Response field note: DB stores `isVerified` (camelCase) but API.md examples show `isverified` (lowercase v) — actual response depends on HttpResponse trimming

---

### POST `/signup` (public)
**Purpose:** Register a new user account

**Request Body (validated via UserDTO Zod schema):**
```json
{
  "name": "string (2-100 chars, letters+spaces only)",
  "email": "string (valid email, lowercased)",
  "password": "string (8-64 chars, must contain uppercase, lowercase, number)",
  "location": {
    "city": "string (2-120 chars, letters+spaces+hyphens)" XOR
    "coordinates": { "lat": -90..90, "lon": -180..180 }
  }
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User created",
  "data": {
    "user": { "uuid", "name", "email", "role": "user", "location", "createdAt" },
    "tokens": { "accessToken", "refreshToken" }
  },
  "status": 201
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 409 | Email already exists |

**Use Case:** `AuthUseCases.signup({ name, email, password, location })`
**Flow:** Check email uniqueness → hash password (bcrypt 12) → create user → generate JWT pair → store refresh token

---

### POST `/login` (public, with emailValidator middleware)
**Purpose:** Authenticate existing user

**Middleware:** `emailValidator` — validates `req.body.email` is valid email format via Zod

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "uuid", "name", "email", "role", "isVerified", "location", "createdAt" },
    "tokens": { "accessToken", "refreshToken" }
  }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 404 | User not found |
| 401 | Invalid credentials |

---

### POST `/refresh` (public)
**Purpose:** Rotate token pair using valid refresh token

**Request Body:**
```json
{
  "refreshToken": "string (JWT)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed",
  "data": {
    "accessToken": "string (JWT, 15m expiry)",
    "refreshToken": "string (JWT, 7d expiry)"
  }
}
```

**Flow:**
1. Verify `refreshToken` JWT signature and expiry
2. Decode UUID from token payload
3. Fetch user from DB by UUID
4. Compare provided token hash against stored `refreshToken` hash (bcrypt compare)
5. Generate new access + refresh token pair
6. Hash and store new refresh token in DB (old one is overwritten — invalidated)

**Errors:**
| Status | Condition |
|--------|-----------|
| 401 | Refresh token invalid, expired, or mismatched stored hash |

---

### POST `/change-password` (authenticated)

**Purpose:** Change account password. Verifies current password, hashes the new one, and clears the stored refresh token (forces re-login on all devices).

**Headers:** `Authorization: Bearer <accessToken>`

**Request Body (validated via ChangePasswordDTO Zod schema):**
```json
{
  "currentPassword": "string",
  "newPassword": "string (8-64 chars, must contain uppercase, lowercase, number)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully",
  "data": { "message": "Password changed successfully" }
}
```

**Flow:**
1. Verify `currentPassword` via `passHasher.compare()` against stored bcrypt hash
2. Hash `newPassword` with bcrypt (12 rounds)
3. Persist new hash via `userRepo.updateByUUID()`
4. Clear stored refresh token (set to null) — terminates all active sessions

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Validation failed (Zod) or current password is incorrect |
| 401 | Missing or invalid access token |

**Use Case:** `AuthUseCases.changePassword(uuid, { currentPassword, newPassword })`

---

### POST `/logout` (authenticated)
**Purpose:** Invalidate refresh token — terminates the session by clearing stored token hash from DB.

**Headers:** `Authorization: Bearer <accessToken>`

**Request Body:** none (empty)

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": { "message": "Logged out successfully" }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 401 | Missing or invalid access token |

**Flow:** Find user by `req.user.uuid` → clear stored `refreshToken` field (set to null) → persist via `userRepo.updateByUUID()`

---

### Response Sanitization
`HttpResponse.success()` automatically strips: `_id`, `__v`, `internalId`, `password`, `refreshToken`, `plantInternalId`, `userInternalId` from all response data.
