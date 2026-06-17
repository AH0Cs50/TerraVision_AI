# API Documentation — User Module

Base URL: `/api/v1/users`

Auth: All endpoints require `Authorization: Bearer <accessToken>` except verify email.

---

### GET `/email/verify` (public)

**Purpose:** Verify user email via token from verification email link.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `token` | string | ✓ | Hex token from verification email |

**Success Response (200):**
```json
{ "success": true, "message": "Email verified successfully" }
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Invalid or expired token |

---

### POST `/email` (authenticated)

**Purpose:** Send verification email to current user. Idempotent — resends if already called.

**Flow:** Generate `crypto.randomBytes(32).toString("hex")` token → store `emailToken` + `emailTokenExpiresAt` in DB → send via nodemailer SMTP (configured in `config.env`).

**Request Body:** none (empty)

**Success Response (200):**
```json
{ "success": true, "message": "Verification email sent" }
```

**Use Case:** `UserUseCases.sendVerificationEmail(req.user.uuid)`

---

### GET `/email` (authenticated)

**Purpose:** Get current user's email verification status.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "email": "joe@farm.com",
    "isVerified": false
  }
}
```

**Use Case:** `UserUseCases.getEmailStatus(req.user.uuid)`

---

### GET `/:id` (authenticated, `:id` is user UUID)

**Purpose:** Get user profile

**Self-or-admin gate:** user must match `:id` OR have role "admin"

**Errors:**
| Status | Condition |
|--------|-----------|
| 401 | Missing/invalid token |
| 403 | Non-owner, non-admin user |
| 404 | User not found |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Farmer Joe",
    "email": "joe@farm.com",
    "role": "user",
    "isVerified": true,
    "location": { "city": "Nairobi" },
    "createdAt": "2026-03-15T12:00:00Z"
  }
}
```

**Use Case:** `UserUseCases.getUser(id, req.user)`

---

### PUT `/:id` (authenticated, `:id` is user UUID)

**Purpose:** Update user profile. Partial updates supported.

**Self-or-admin gate:** user must match `:id` OR have role "admin"

**Protected fields (stripped server-side, never updated):** `password`, `role`, `internalId`, `uuid`, `isVerified`

**Request Body (partial):**
```json
{
  "name": "Farmer Joe Updated",
  "location": { "city": "Nairobi" }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Validation failure (Zod) |
| 401 | Missing/invalid token |
| 403 | Non-owner, non-admin user |
| 404 | User not found |

**Success Response (200):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Farmer Joe Updated",
    "email": "joe@farm.com",
    "role": "user",
    "isVerified": true,
    "location": { "city": "Nairobi" },
    "createdAt": "2026-03-15T12:00:00Z"
  }
}
```

**Use Case:** `UserUseCases.updateUser(id, req.body, req.user)`

---

### DELETE `/:id` (admin only)

**Purpose:** Permanently delete a user account and all associated plants/data.

**Access control:** Admin-only — requires `authorize("admin")` middleware. Regular users cannot delete their own accounts.

**Errors:**
| Status | Condition |
|--------|-----------|
| 403 | Non-admin user attempts delete |
| 404 | User not found |

**Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Use Case:** `UserUseCases.deleteUser(id, req.user)`
