# Deepself API Documentation

**Version:** 0.101.0
**Base URL:** `http://localhost:8000` (development)

---

## Authentication

All authenticated endpoints require a Bearer token in the `Authorization` header. The API supports two types of authentication:

### 1. JWT Token Authentication (Recommended for Web/Mobile Apps)

Used by web and mobile applications for user sessions.

```
Authorization: Bearer <your_jwt_token>
```

**How to get a JWT token:**
- Register: `POST /auth/register-email`
- Login: `POST /auth/login`

**Token properties:**
- Expires after 24 hours
- Automatically issued on registration/login
- Best for frontend applications

### 2. API Key Authentication (Recommended for Scripts/Integrations)

Used by scripts, automation, and third-party integrations.

```
Authorization: Bearer <your_api_key>
```

**How to get an API key:**
- First, obtain a JWT token by logging in
- Create API key: `POST /v1/auth/api-keys` (requires JWT token)

**API key properties:**
- Long-lived (configurable expiration)
- Can be revoked at any time
- Best for programmatic access

**Note:** All V1 API endpoints (`/v1/*`) accept both JWT tokens and API keys. The API automatically detects which type of credential you're using.

---

## Endpoints

### Health Check

**Endpoint:** `GET /health`

**Authentication:** None required

**Success Response (200 OK):**
```json
{"status": "ok", "version": "0.101.0"}
```

---

### Register with Email/Password

Create a new account using email and password authentication.

**Endpoint:** `POST /auth/register-email`

**Authentication:** None required

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "username": "john"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Display name for the user |
| `email` | string | Yes | Email address (must be unique, case-insensitive) |
| `password` | string | Yes | Password (minimum 8 characters, must include uppercase, lowercase, number, and special character) |
| `username` | string | No | Unique username (defaults to sanitized email if not provided: @ replaced with __, case-insensitive) |

**Success Response (200 OK):**
```json
{
  "success": true,
  "messages": [],
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user_id": "e0f9f569-c56e-4592-ad35-7a59e35eb48b",
    "is_admin": true
  },
  "error": null,
  "meta": null
}
```

| Field | Type | Description |
|-------|------|-------------|
| `token` | string | JWT token for authentication |
| `user_id` | string | Unique identifier for the created user account |
| `is_admin` | boolean | Admin status (newly registered users are self-owned admins) |

**Error Responses:**

**422 Unprocessable Entity** - Validation error:
```json
{
  "detail": "Registration failed",
  "messages": ["EMAIL_EXISTS"]
}
```

Common error codes:
- `EMAIL_EXISTS` - Email already registered
- `USERNAME_EXISTS` - Username already taken
- Password validation errors (returned as array of requirement messages)

**Examples:**

Without custom username (defaults to email):
```bash
curl -X POST http://localhost:8000/auth/register-email \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

With custom username:
```bash
curl -X POST http://localhost:8000/auth/register-email \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "username": "john"
  }'
```

---

### Login with Email/Password

Authenticate with email or username and password to receive a JWT token.

**Endpoint:** `POST /auth/login`

**Authentication:** None required

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Email address or username |
| `password` | string | Yes | Account password |

**Success Response (200 OK):**
```json
{
  "success": true,
  "messages": [],
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user_id": "c31eeb34-d897-4a7f-b283-28aa0139826f",
    "is_admin": true
  },
  "error": null,
  "meta": null
}
```

| Field | Type | Description |
|-------|------|-------------|
| `token` | string | JWT token for authentication (valid for 24 hours) |
| `user_id` | string | Unique identifier for the authenticated user account |
| `is_admin` | boolean | Admin status of the account |

**Error Responses:**

**403 Forbidden** - Invalid credentials:
```json
{
  "detail": "Invalid email or password"
}
```

**403 Forbidden** - Account uses Web3 authentication only:
```json
{
  "detail": "This account uses Web3 authentication only"
}
```

**Examples:**

Login with email:
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

Login with username:
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser",
    "password": "SecurePass123!"
  }'
```

---

### Web3 — Get Nonce

Get a sign-in nonce for a wallet address. Used as the first step of Web3 login.

**Endpoint:** `GET /auth/nonce/{address}`

**Authentication:** None required

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `address` | string | Yes | Ethereum wallet address (e.g. `0xAbC...`) |

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "exists": true,
    "nonce": "Sign this message to login: 1708295123.456789"
  }
}
```

If no account exists for this wallet: `"exists": false, "nonce": null`.

---

### Web3 — Verify Signature

Verify an Ethereum signature to authenticate. Returns a JWT token on success.

**Endpoint:** `POST /auth/verify`

**Authentication:** None required

**Request Body:**
```json
{
  "address": "0xAbC...",
  "signature": "0x...",
  "nonce": "Sign this message to login: 1708295123.456789"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "iam_id": "e0f9f569-c56e-4592-ad35-7a59e35eb48b",
    "is_admin": true
  }
}
```

---

### Web3 — Register with Invite Key

Register a new account using a wallet signature and an invite key.

**Endpoint:** `POST /auth/register`

**Authentication:** None required

**Request Body:**
```json
{
  "username": "alice",
  "address": "0xAbC...",
  "signature": "0x...",
  "message": "Register IAM: alice, invite: abc123, timestamp: 1708295123",
  "invite_key": "abc123"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `username` | string | Yes | Desired username (globally unique) |
| `address` | string | Yes | Ethereum wallet address |
| `signature` | string | Yes | EIP-191 signature of `message` |
| `message` | string | Yes | Must start with `"Register IAM:"` and contain the invite key |
| `invite_key` | string | Yes | A valid unused, unexpired invite key |

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user_id": "e0f9f569-...",
    "is_admin": true
  }
}
```

**Error Responses:**

**422 Unprocessable Entity** — Invalid invite key:
```json
{"detail": "Invalid or already used invite key", "messages": ["INVALID_INVITE_KEY"]}
```

---

### Web3 — Check Invite Key

Check whether a given invite key is valid and can be used for registration.

**Endpoint:** `GET /auth/register/{invite_key}`

**Authentication:** None required

**Success Response (200 OK):**
```json
{"success": true, "data": {"can_register": true}}
```

---

### Web3 — Link Wallet

Link an Ethereum wallet address to an existing email/password account.

**Endpoint:** `POST /auth/link-wallet`

**Authentication:** JWT token required

**Request Body:**
```json
{
  "address": "0xAbC...",
  "signature": "0x...",
  "message": "Link wallet: 0xAbC... to account at timestamp: 1708295123"
}
```

**Success Response (200 OK):**
```json
{"success": true, "data": {"wallet": "0xabc..."}, "messages": ["Wallet successfully linked to account"]}
```

**Error Responses:**

**422** — Wallet already linked to another account:
```json
{"detail": "Wallet address already linked to another account"}
```

---

### Invite Keys — Generate

Generate a new invite key that can be used to register a new user account.

**Endpoint:** `POST /auth/{user_uid}/generate-invite`

**Authentication:** JWT token required (must own `user_uid`)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `user_uid` | string | IAM UID of the inviting user |

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "invite_key": "abc123...",
    "created_at": "2026-02-18T12:00:00",
    "expires_at": null
  }
}
```

**Error Responses:**

**422** — Invite limit reached:
```json
{"detail": "Invite limit exceeded", "messages": ["INVITE_LIMIT_EXCEEDED"]}
```

The per-IAM invite limit is controlled by `MAX_INVITES_PER_IAM` (default 10).

---

### Invite Keys — List

List all invite keys created by a user.

**Endpoint:** `GET /auth/{user_uid}/invites`

**Authentication:** JWT token required (must own `user_uid`)

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "invite_key": "abc123...",
      "created_at": "2026-02-18T12:00:00",
      "expires_at": null,
      "used": false,
      "used_by": null
    }
  ]
}
```

---

### Invite Keys — Delete

Delete specific unused invite keys by ID.

**Endpoint:** `DELETE /auth/{user_uid}/invites`

**Authentication:** JWT token required (must own `user_uid`)

**Request Body:**
```json
{"invite_ids": [1, 2, 3]}
```

**Success Response (200 OK):**
```json
{"success": true, "data": {"deleted_count": 2}, "messages": ["Deleted 2 invite key(s)"]}
```

**Notes:** Only unused invites are deleted. Already-used invites in the list are silently skipped.

---

### Create API Key

Create a new API key for programmatic access. API keys are long-lived credentials that can be used instead of JWT tokens for automation and scripts.

**Endpoint:** `POST /v1/auth/api-keys`

**Authentication:** JWT token required (Bearer token)

**Request Body:**
```json
{
  "name": "My API Key",
  "expires_in_days": 365
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Descriptive name for the API key |
| `expires_in_days` | integer | No | Number of days until expiration (default: no expiration) |

**Success Response (200 OK):**
```json
{
  "key": "sk-proj-oEQvg8fehE-yAoNqML7vFIcM3JSJ2wHJ",
  "key_id": "ae518fb4-69d1-409b-9e2a-deb1995daaac",
  "name": "Test API Key",
  "created_at": "2026-02-13T17:58:02.180981",
  "expires_at": null,
  "key_prefix": "sk-proj-oEQvg8fehE-y"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `key` | string | **Full API key - only shown once!** Save this immediately as it cannot be retrieved again |
| `key_id` | string | Unique identifier for the API key (UUID) |
| `name` | string | Descriptive name for the key |
| `created_at` | string | ISO 8601 timestamp of creation |
| `expires_at` | string/null | ISO 8601 timestamp of expiration (null if no expiration) |
| `key_prefix` | string | First 20 characters of the key for identification |

**Error Responses:**

**401 Unauthorized** - Invalid or missing JWT token:
```json
{
  "detail": "Invalid credentials"
}
```

**Example:**

```bash
# Login to get JWT token
JWT=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }' | jq -r '.data.token')

# Create API key
curl -X POST http://localhost:8000/v1/auth/api-keys \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production API Key",
    "expires_in_days": 365
  }'
```

**Notes:**
- The full API key is only returned once during creation and cannot be retrieved later
- Save the key immediately in a secure location (password manager, environment variable, etc.)
- If you lose the key, you must revoke it and create a new one
- API keys can be used in place of JWT tokens for all V1 API endpoints
- Keys with no expiration (expires_in_days omitted) never expire unless manually revoked

---

### List API Keys

List all API keys for the authenticated user, ordered by creation date (newest first).

**Endpoint:** `GET /v1/auth/api-keys`

**Authentication:** JWT token required (Bearer token)

**Success Response (200 OK):**
```json
[
  {
    "id": "ae518fb4-69d1-409b-9e2a-deb1995daaac",
    "key_prefix": "sk-proj-oEQvg8fehE-y",
    "name": "Test API Key",
    "created_at": "2026-02-13T17:58:02.180981",
    "last_used_at": null,
    "expires_at": null,
    "revoked": false,
    "scopes": ["v1:*"]
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier for the API key (UUID) |
| `key_prefix` | string | First 20 characters of the key for identification |
| `name` | string | Descriptive name for the key |
| `created_at` | string | ISO 8601 timestamp of creation |
| `last_used_at` | string/null | ISO 8601 timestamp of last use (null if never used) |
| `expires_at` | string/null | ISO 8601 timestamp of expiration (null if no expiration) |
| `revoked` | boolean | Whether the key has been revoked |
| `scopes` | array | Array of permission scopes |

**Error Responses:**

**401 Unauthorized** - Invalid or missing JWT token:
```json
{
  "detail": "Invalid credentials"
}
```

**Example:**

```bash
# Login to get JWT token
JWT=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }' | jq -r '.data.token')

# List API keys
curl -X GET http://localhost:8000/v1/auth/api-keys \
  -H "Authorization: Bearer $JWT"
```

**Notes:**
- Only shows the key prefix, not the full key (for security)
- Keys are ordered by creation date (newest first)
- Shows last_used_at timestamp for monitoring key usage
- Includes both active and revoked keys

---

### Revoke API Key

Revoke an API key to prevent it from being used for authentication. Revoked keys remain visible in the list but cannot be used.

**Endpoint:** `DELETE /v1/auth/api-keys/{key_id}`

**Authentication:** JWT token required (Bearer token)

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key_id` | string | Yes | API key ID (UUID) |

**Success Response (200 OK):**
```json
{
  "revoked": true,
  "key_id": "ae518fb4-69d1-409b-9e2a-deb1995daaac"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `revoked` | boolean | Always true on successful revocation |
| `key_id` | string | ID of the revoked key |

**Error Responses:**

**404 Not Found** - API key not found or not owned by user:
```json
{
  "detail": "API key not found"
}
```

**401 Unauthorized** - Invalid or missing JWT token:
```json
{
  "detail": "Invalid credentials"
}
```

**Example:**

```bash
# Login to get JWT token
JWT=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }' | jq -r '.data.token')

# Revoke API key
curl -X DELETE http://localhost:8000/v1/auth/api-keys/ae518fb4-69d1-409b-9e2a-deb1995daaac \
  -H "Authorization: Bearer $JWT"
```

**Notes:**
- Revoking a key is permanent and cannot be undone
- Revoked keys remain in the list but with `revoked: true`
- Attempting to use a revoked key will result in 401 Unauthorized
- If you need a key again, create a new one

---

### Update API Key

Update an API key's display name.

**Endpoint:** `PATCH /v1/auth/api-keys/{key_id}?name={new_name}`

**Authentication:** JWT token required (Bearer token)

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key_id` | string | Yes | API key ID (UUID) |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | No | New display name for the key |

**Success Response (200 OK):**
```json
{
  "id": "ae518fb4-69d1-409b-9e2a-deb1995daaac",
  "name": "Production Key",
  "updated": true
}
```

**Example:**
```bash
curl -X PATCH "http://localhost:8000/v1/auth/api-keys/ae518fb4-69d1-409b-9e2a-deb1995daaac?name=Production+Key" \
  -H "Authorization: Bearer $JWT"
```

---

### Create Model

Create a new model (deepself AI) owned by the authenticated user.

**Note:** Model usernames are unique per owner, not globally. Two different users can create models with the same username (e.g., both can have `mybot`), but one user cannot create two models with the same username.

**Endpoint:** `POST /v1/models`

**Authentication:** JWT token or API key required (Bearer token)

**Request Body:**
```json
{
  "username": "clawdbot",
  "name": "Clawdbot Assistant",
  "basic_facts": {},
  "default_tools": []
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `username` | string | Yes | Model identifier - must contain only lowercase letters, dashes, and numbers; maximum 32 characters |
| `name` | string | Yes | Display name for the model |
| `basic_facts` | object | No | Initial facts/knowledge about the model. Keys are normalized to lowercase snake_case (e.g., "Marital Status" becomes "marital_status"). Values are limited to 500 characters. (default: {}) |
| `default_tools` | array | No | List of tool IDs for the model's default capabilities (default: []) |

**Success Response (200 OK):**
```json
{
  "id": "clawdbot",
  "object": "model",
  "created": 1770972080,
  "owned_by": "testuser",
  "name": "Clawdbot Assistant",
  "basic_facts": {},
  "default_tools": []
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Model identifier (same as username) |
| `object` | string | Object type (always "model") |
| `created` | integer | Unix timestamp of creation |
| `owned_by` | string | Username of the owner |
| `name` | string | Display name for the model |
| `basic_facts` | object | Facts/knowledge about the model (structured format) |
| `default_tools` | array | List of default tool IDs |

**Error Responses:**

**400 Bad Request** - Invalid username format:
```json
{
  "detail": "Model username must be 32 characters or fewer"
}
```

```json
{
  "detail": "Model username can only contain lowercase letters, dashes, and numbers"
}
```

**400 Bad Request** - Invalid basic_facts value:
```json
{
  "detail": "basic_facts['Age']: value exceeds maximum length of 500 characters (got 750)"
}
```

**400 Bad Request** - Duplicate model username:
```json
{
  "detail": "You already have a model with username 'testbot'"
}
```

**403 Forbidden** - Plan limit reached:
```json
{
  "detail": "Plan limit reached (10/10 models). Upgrade your plan at GET /v1/billing/subscription."
}
```

| Plan | IAM limit |
|------|-----------|
| free | 10 |
| standard | 100 |
| pro | 1000 |

**401 Unauthorized** - Invalid or missing credentials:
```json
{
  "detail": "Invalid credentials"
}
```

**Examples:**

Using JWT token (typical for web/mobile apps):
```bash
# Login to get JWT token
JWT=$(curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }' | jq -r '.data.token')

# Create a model with JWT
curl -X POST http://localhost:8000/v1/models \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "clawdbot",
    "name": "Clawdbot Assistant"
  }'
```

Using API key (typical for scripts/automation):
```bash
# First, get an API key (requires JWT from login)
JWT="your_jwt_token"
API_KEY=$(curl -X POST http://localhost:8000/v1/auth/api-keys \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"name": "My API Key"}' | jq -r '.key')

# Create a model with API key
curl -X POST http://localhost:8000/v1/models \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "clawdbot",
    "name": "Clawdbot Assistant"
  }'
```

---

### List Models

List all models owned by the authenticated user, ordered by creation date.

**Endpoint:** `GET /v1/models`

**Authentication:** JWT token or API key required (Bearer token)

**Success Response (200 OK):**
```json
{
  "object": "list",
  "data": [
    {
      "id": "testbot",
      "object": "model",
      "created": 1770986704,
      "owned_by": "testuser",
      "name": "Test Bot",
      "basic_facts": {},
      "default_tools": []
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `object` | string | Object type (always "list") |
| `data` | array | Array of model objects |
| `data[].id` | string | Model identifier (username) |
| `data[].object` | string | Object type (always "model") |
| `data[].created` | integer | Unix timestamp of creation |
| `data[].owned_by` | string | Username of the owner |
| `data[].name` | string/null | Display name for the model |
| `data[].basic_facts` | object/null | Facts/knowledge about the model |
| `data[].default_tools` | array | List of default tool IDs |

**Error Responses:**

**401 Unauthorized** - Invalid or missing credentials:
```json
{
  "detail": "Invalid credentials"
}
```

**Example:**

```bash
# Using JWT token
JWT=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }' | jq -r '.data.token')

curl -X GET http://localhost:8000/v1/models \
  -H "Authorization: Bearer $JWT"
```

```bash
# Using API key
curl -X GET http://localhost:8000/v1/models \
  -H "Authorization: Bearer $API_KEY"
```

**Notes:**
- Only returns models owned by the authenticated user
- Models are ordered by creation date
- Returns empty array if user has no models

---

### Retrieve Model

Get details about a specific model by its ID (username).

**Endpoint:** `GET /v1/models/{model_id}`

**Authentication:** JWT token or API key required (Bearer token)

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `model_id` | string | Yes | Model username (e.g., "clawdbot") |

**Success Response (200 OK):**
```json
{
  "id": "clawdbot",
  "object": "model",
  "created": 1770972080,
  "owned_by": "testuser",
  "name": "Clawdbot Assistant",
  "basic_facts": {
    "version": {
      "value": "1.0",
      "status": "stated",
      "identification": "user-provided"
    }
  },
  "default_tools": []
}
```

**Error Responses:**

**404 Not Found** - Model not found:
```json
{
  "detail": "Model clawdbot not found"
}
```

**403 Forbidden** - No access to model:
```json
{
  "detail": "You do not have access to this model"
}
```

**401 Unauthorized** - Invalid or missing credentials:
```json
{
  "detail": "Invalid credentials"
}
```

**Example:**

```bash
curl -X GET http://localhost:8000/v1/models/clawdbot \
  -H "Authorization: Bearer $API_KEY"
```

---

### Update Model

Update a model's name, basic_facts, or default_tools.

**Endpoint:** `PATCH /v1/models/{model_id}`

**Authentication:** JWT token or API key required (Bearer token)

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `model_id` | string | Yes | Model username (e.g., "clawdbot") |

**Request Body:**

All fields are optional - only include fields you want to update:

```json
{
  "name": "Updated Model Name",
  "basic_facts": {
    "version": "2.0",
    "status": "production",
    "region": "us-west"
  },
  "default_tools": ["tool1", "tool2"]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | New display name for the model |
| `basic_facts` | object | No | Facts to update (replaces existing facts with same keys, adds new keys). Keys are normalized to lowercase snake_case. Values limited to 500 characters. |
| `default_tools` | array | No | New list of default tool IDs (replaces existing list) |

**Success Response (200 OK):**

Returns the updated model in the same format as Create/Retrieve Model.

```json
{
  "id": "clawdbot",
  "object": "model",
  "created": 1770972080,
  "owned_by": "testuser",
  "name": "Updated Model Name",
  "basic_facts": {
    "version": {
      "value": "2.0",
      "status": "stated",
      "identification": "user-provided"
    },
    "status": {
      "value": "production",
      "status": "stated",
      "identification": "user-provided"
    },
    "region": {
      "value": "us-west",
      "status": "stated",
      "identification": "user-provided"
    }
  },
  "default_tools": ["tool1", "tool2"]
}
```

**Error Responses:**

**404 Not Found** - Model not found:
```json
{
  "detail": "Model clawdbot not found"
}
```

**403 Forbidden** - No access to model:
```json
{
  "detail": "You do not have access to this model"
}
```

**400 Bad Request** - Invalid basic_facts value:
```json
{
  "detail": "basic_facts['description']: value exceeds maximum length of 500 characters (got 750)"
}
```

**401 Unauthorized** - Invalid or missing credentials:
```json
{
  "detail": "Invalid credentials"
}
```

**Examples:**

Update name only:
```bash
curl -X PATCH http://localhost:8000/v1/models/clawdbot \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Bot"
  }'
```

Update basic_facts only:
```bash
curl -X PATCH http://localhost:8000/v1/models/clawdbot \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "basic_facts": {
      "version": "2.0",
      "status": "live"
    }
  }'
```

Update multiple fields:
```bash
curl -X PATCH http://localhost:8000/v1/models/clawdbot \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Bot",
    "basic_facts": {
      "version": "2.0",
      "environment": "production"
    },
    "default_tools": ["search", "calculator"]
  }'
```

**Notes:**
- Basic facts are updated/merged, not replaced entirely. Existing keys not in the update remain unchanged.
- To remove a basic fact, you would need to use a separate delete operation (not currently implemented).
- Cache invalidation runs automatically in the background when basic_facts are updated.

---

### Delete Model

Delete a model and all associated training data. This operation is permanent and cannot be undone.

**Endpoint:** `DELETE /v1/models/{model_id}`

**Authentication:** JWT token or API key required (Bearer token)

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `model_id` | string | Yes | Model username (e.g., "clawdbot") |

**Success Response (200 OK):**
```json
{
  "deleted": true
}
```

| Field | Type | Description |
|-------|------|-------------|
| `deleted` | boolean | Always true on successful deletion |

**Error Responses:**

**404 Not Found** - Model not found:
```json
{
  "detail": "Model clawdbot not found"
}
```

**403 Forbidden** - No access to model:
```json
{
  "detail": "You do not have access to this model"
}
```

**401 Unauthorized** - Invalid or missing credentials:
```json
{
  "detail": "Invalid credentials"
}
```

**Example:**

```bash
curl -X DELETE http://localhost:8000/v1/models/deletetest \
  -H "Authorization: Bearer $API_KEY"
```

**Notes:**
- Deletion is permanent and cannot be undone
- All associated training data will be removed
- Training rooms and documents associated with the model will also be deleted
- Use with caution - consider backing up important models before deletion

---

### Train with Document

Train a model by providing a document with content in first-person or third-person perspective. The document is automatically extracted and archived into the model's knowledge graph.

**Endpoint:** `POST /v1/models/{model_id}/training/documents`

**Authentication:** JWT token or API key required (Bearer token)

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `model_id` | string | Yes | Model username (e.g., "clawdbot") |

**Request Body:**
```json
{
  "label": "Bio",
  "content": "I am a software engineer who loves hiking and mountain biking. I grew up in Colorado and now live in California.",
  "perspective": "first-person"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `label` | string | Yes | Descriptive label for the document |
| `content` | string | Yes | The document content to extract knowledge from |
| `perspective` | string | Yes | Narrative perspective: "first-person" or "third-person" |

**Success Response (200 OK):**
```json
{
  "document_id": "9f6dbed9-32f1-482f-be46-84889343ba45",
  "status": "archived",
  "stats": {
    "epsilons_processed": 3,
    "betas_processed": 0,
    "deltas_processed": 0,
    "alphas_processed": 2
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `document_id` | string | Unique identifier for the document (UUID) |
| `status` | string | Processing status (always "archived" on success - documents are processed immediately) |
| `stats.epsilons_processed` | integer | Number of facts extracted (e.g., occupation, location) |
| `stats.betas_processed` | integer | Number of betas extracted |
| `stats.deltas_processed` | integer | Number of deltas extracted |
| `stats.alphas_processed` | integer | Number of alphas extracted |

**Error Responses:**

**403 Forbidden** - No access to model:
```json
{
  "detail": "You do not have access to this model"
}
```

**404 Not Found** - Model not found:
```json
{
  "detail": "Model clawdbot not found"
}
```

**401 Unauthorized** - Invalid or missing credentials:
```json
{
  "detail": "Invalid credentials"
}
```

**Example:**

```bash
curl -X POST http://localhost:8000/v1/models/clawdbot/training/documents \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Bio",
    "content": "I am a software engineer who loves hiking and mountain biking. I grew up in Colorado and now live in California.",
    "perspective": "first-person"
  }'
```

**Notes:**
- Documents are processed and archived immediately (no separate finalize step required)
- First-person perspective is used for biographical content about the model itself
- Third-person perspective is used for content about others or general knowledge
- Extraction automatically identifies alphas/betas/deltas/epsilons
- Use documents for structured knowledge; use training rooms for conversational context

---

### Create Training Room

Create a new training room for a model. Training rooms are used to provide conversational context that will be extracted and archived into the model's knowledge graph.

**Endpoint:** `POST /v1/models/{model_id}/training/rooms`

**Authentication:** JWT token or API key required (Bearer token)

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `model_id` | string | Yes | Model username (e.g., "clawdbot") |

**Request Body:**
```json
{
  "label": "Training Session 1",
  "user_model": "clawdbot"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `label` | string | Yes | Descriptive label for this training room |
| `user_model` | string | Yes | Model username (must match path parameter) |

**Success Response (200 OK):**
```json
{
  "room_id": "a18e3b8b-e3cc-468d-85a4-67feb18a043c",
  "status": "open"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `room_id` | string | Unique identifier for the training room (UUID) |
| `status` | string | Room status (always "open" on creation) |

**Error Responses:**

**403 Forbidden** - No access to model:
```json
{
  "detail": "You do not have access to this user model"
}
```

**401 Unauthorized** - Invalid or missing credentials:
```json
{
  "detail": "Invalid credentials"
}
```

**Example:**

```bash
curl -X POST http://localhost:8000/v1/models/clawdbot/training/rooms \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Training Session 1",
    "user_model": "clawdbot"
  }'
```

---

### Add Message to Training Room

Add a first-person message to an open training room. The room accumulates a `running_extraction` of knowledge (epsilons/betas/deltas/alphas) as messages are added. Call `finalize` when done to archive it all to the knowledge graph.

**Endpoint:** `POST /v1/training/rooms/{room_id}/messages`

**Authentication:** JWT token or API key required (Bearer token)

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `room_id` | string | Yes | Training room UUID |

**Request Body:**
```json
{
  "role": "user",
  "content": "I grew up in Colorado and moved to San Francisco for work."
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `role` | string | Yes | Must be `"user"` (training rooms only accept first-person messages) |
| `content` | string | Yes | The message content |

**Success Response (200 OK):**
```json
{
  "message_id": "3",
  "running_extraction": {
    "epsilons": {"location": "San Francisco", "origin": "Colorado"},
    "betas": [],
    "deltas": [],
    "alphas": {}
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `message_id` | string | Index of the message in the room |
| `running_extraction` | object/null | Accumulated knowledge so far (epsilons = facts, betas = beliefs, deltas = types, alphas = entities) |

**Error Responses:**

**404 Not Found** - Room not found:
```json
{"detail": "Training room not found"}
```

**403 Forbidden** - No access to room:
```json
{"detail": "You do not have access to this training room"}
```

**Example:**
```bash
curl -X POST http://localhost:8000/v1/training/rooms/41377fd4-c5f0-4c9d-9e1d-eb7b39a2863c/messages \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"role": "user", "content": "I believe honesty is the most important value in life."}'
```

**Notes:**
- Add multiple messages to build up a rich training context before finalizing
- The `running_extraction` preview is informational — the actual archiving happens at `finalize`
- Rooms of type `"chat"` (used with `POST /v1/chat/completions`) also accept messages via this endpoint

---

### Chat Completions

Generate a chat completion response. Can be used for stateless chat or with a training room to provide conversational training data.

**Endpoint:** `POST /v1/chat/completions`

**Authentication:** JWT token or API key required (Bearer token)

**Request Body:**
```json
{
  "model": "clawdbot",
  "room_id": "a18e3b8b-e3cc-468d-85a4-67feb18a043c",
  "messages": [
    {
      "role": "user",
      "content": "I think honesty is the most important value in life"
    }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `model` | string | Yes | Model username to use for generation (optionally `username@model-override` to specify the LLM, e.g. `clawdbot@gpt-4o-mini`) |
| `room_id` | string | No | Training room ID for context and extraction (omit for stateless chat) |
| `messages` | array | Yes | Array of message objects with `role` and `content` |

**Success Response (200 OK):**
```json
{
  "id": "chatcmpl-680303b0-24b4-4797-9a37-4e9654826aee",
  "object": "chat.completion",
  "created": 1771003146,
  "model": "clawdbot",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "That's a powerful idea! How do you think honesty influences your relationships?",
        "name": null
      },
      "finish_reason": "stop"
    }
  ],
  "usage": null
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier for the completion |
| `object` | string | Object type (always "chat.completion") |
| `created` | integer | Unix timestamp of creation |
| `model` | string | Model used for generation |
| `choices` | array | Array of completion choices (typically one) |
| `choices[].message` | object | The generated message with role and content |
| `finish_reason` | string | Reason for completion ("stop", "length", etc.) |
| `usage` | object/null | Token usage information (null currently; will return `{"prompt_tokens": int, "completion_tokens": int}` after billing is enabled) |

**Error Responses:**

**404 Not Found** - Model not found:
```json
{
  "detail": "Model clawdbot not found"
}
```

**402 Payment Required** - Insufficient credit balance:
```json
{
  "detail": "Insufficient balance. Please top up your account."
}
```

**400 Bad Request** - Unsupported model override:
```json
{
  "detail": "Unsupported model 'gpt-99-fake'. See /v1/models/supported for available models."
}
```

**403 Forbidden** - No access to model:
```json
{
  "detail": "You do not have access to this model"
}
```

**401 Unauthorized** - Invalid or missing credentials:
```json
{
  "detail": "Invalid credentials"
}
```

**Examples:**

Stateless chat (no room):
```bash
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "clawdbot",
    "messages": [
      {"role": "user", "content": "Tell me about yourself"}
    ]
  }'
```

Stateless chat with LLM override:
```bash
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "clawdbot@gpt-4o-mini",
    "messages": [
      {"role": "user", "content": "Tell me about yourself"}
    ]
  }'
```

Training room chat (with extraction):
```bash
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "clawdbot",
    "room_id": "a18e3b8b-e3cc-468d-85a4-67feb18a043c",
    "messages": [
      {"role": "user", "content": "I believe honesty is the most important value"}
    ]
  }'
```

**Notes:**
- When `room_id` is provided, the conversation is stored and alphas/betas/deltas/epsilons are extracted from user messages
- Extraction happens during chat but is only archived when the room is finalized
- Messages are automatically added to the room with the assistant's response

---

### Finalize Training Room

Finalize a training room and archive all extracted knowledge into the model's knowledge graph. This processes alphas/betas/deltas/epsilons from the conversation.

**Endpoint:** `POST /v1/training/rooms/{room_id}/finalize`

**Authentication:** JWT token or API key required (Bearer token)

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `room_id` | string | Yes | Training room UUID |

**Success Response (200 OK):**
```json
{
  "status": "finalized",
  "stats": {
    "epsilons_processed": 0,
    "betas_processed": 1,
    "deltas_processed": 0,
    "alphas_processed": 0
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Finalization status (always "finalized" on success) |
| `stats.epsilons_processed` | integer | Number of epsilons processed |
| `stats.betas_processed` | integer | Number of betas processed |
| `stats.deltas_processed` | integer | Number of deltas processed |
| `stats.alphas_processed` | integer | Number of alphas processed |

**Error Responses:**

**404 Not Found** - Room not found:
```json
{
  "detail": "Training room not found"
}
```

**403 Forbidden** - No access to room:
```json
{
  "detail": "You do not have access to this training room"
}
```

**401 Unauthorized** - Invalid or missing credentials:
```json
{
  "detail": "Invalid credentials"
}
```

**Example:**

```bash
curl -X POST http://localhost:8000/v1/training/rooms/a18e3b8b-e3cc-468d-85a4-67feb18a043c/finalize \
  -H "Authorization: Bearer $API_KEY"
```

**Notes:**
- Finalization triggers the 4-phase archive process:
  - Phase 2.1: Process epsilons
  - Phase 2.2: Process betas and deltas
  - Phase 2.3: Process alphas
  - Phase 2.4: Cleanup and weight recalculation
- After finalization, the room's running_extraction is cleared
- Finalization uses ContentMatcher for deduplication (0.88 similarity threshold)
- Parent-child hierarchies are created for betas and deltas
- Once finalized, the knowledge is permanently added to the model's graph

---

## Response Format

All API responses follow a standard format:

```json
{
  "success": boolean,
  "messages": string[],
  "data": object | null,
  "error": string | null,
  "meta": object | null
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the request was successful |
| `messages` | array | Array of informational messages or error codes |
| `data` | object/null | Response payload (null on error) |
| `error` | string/null | Error message (null on success) |
| `meta` | object/null | Additional metadata (optional) |

---

## Password Requirements

Passwords must meet the following criteria:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

---

## Notes

- Email addresses are stored and compared case-insensitively
- Usernames are case-insensitive for lookups but stored as provided
- If username is not provided during registration, it defaults to the email address with `@` replaced by `__` (e.g., `john@example.com` becomes `john__example.com`)
- User username format: Only lowercase letters, underscores, and numbers allowed
- Model username format: Only lowercase letters, dashes, and numbers allowed; maximum 32 characters (e.g., `clawdbot`, `my-model-v2`)
- **Username uniqueness scoping**:
  - User usernames are globally unique (no two users can have the same username)
  - Model usernames are unique per owner (two users can both have `mybot`, but one user cannot have two models named `mybot`)
  - This allows multiple users to create models with common names without conflicts
- Basic facts keys are automatically normalized to lowercase snake_case: `"Marital Status"` → `"marital_status"`, `"homeCity"` → `"home_city"`
- Basic facts values are limited to 500 characters maximum
- Basic facts with identical keys and values share the same graph vertex (exact string matching after normalization)
- Newly registered users are created as self-owned admins with full permissions
- JWT tokens expire after 24 hours and must be refreshed
- All timestamps are in ISO 8601 format (UTC)

---

### Get Supported Models (Public)

Return the list of LLM model identifiers that can be used in the `username@model` override syntax.

**Endpoint:** `GET /v1/models/supported`

**Authentication:** None required

**Success Response (200 OK):**
```json
{
  "models": [
    {"model": "gpt-4o", "provider": "openai"},
    {"model": "gpt-4o-mini", "provider": "openai"},
    {"model": "claude-sonnet-4-6", "provider": "anthropic"}
  ]
}
```

**Example:**
```bash
curl http://localhost:8000/v1/models/supported
```

---

### Billing — Get Balance

Return the authenticated user's current credit balance and frozen status.

**Endpoint:** `GET /v1/billing/balance`

**Authentication:** JWT token or API key required

**Success Response (200 OK):**
```json
{
  "iam_id": "c31eeb34-d897-4a7f-b283-28aa0139826f",
  "balance_usd": 0.0854,
  "frozen": false
}
```

---

### Billing — Usage History

Return paginated token-usage ledger entries for the authenticated user.

**Endpoint:** `GET /v1/billing/usage`

**Authentication:** JWT token or API key required

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number (1-based) |
| `limit` | integer | 20 | Items per page (max 100) |

**Success Response (200 OK):**
```json
{
  "entries": [
    {
      "id": "...",
      "request_id": "...",
      "model_username": "clawdbot",
      "provider": "openai",
      "llm_model": "gpt-4o-mini",
      "input_tokens": 512,
      "output_tokens": 128,
      "provider_cost_usd": 0.00009,
      "markup_usd": 0.0000045,
      "total_deducted_usd": 0.0000945,
      "created_at": "2026-02-18T12:00:00"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 1
}
```

---

### Billing — Top Up

Record a top-up transaction. Validates `payment_ref` uniqueness (prevents double-crediting), inserts a `topup_transactions` row, and increments `balance_usd`. If the account was frozen and the new balance is positive, it is unfrozen.

**Endpoint:** `POST /v1/billing/topup`

**Authentication:** JWT token or API key required

**Request Body:**
```json
{
  "amount_usd": 10.00,
  "payment_ref": "pi_3OuXxxx"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `amount_usd` | number | Yes | Amount in USD to credit (must be > 0) |
| `payment_ref` | string | Yes | Unique payment reference (e.g. Stripe `payment_intent` ID) |

**Success Response (200 OK):**
```json
{
  "success": true,
  "new_balance_usd": 10.0854,
  "frozen": false
}
```

**Error Responses:**

**409 Conflict** - Duplicate payment reference:
```json
{
  "detail": "Payment reference already processed"
}
```

---

### Billing — Subscription Status

Return the authenticated user's current plan, status, IAM usage vs limit, and renewal date.

**Endpoint:** `GET /v1/billing/subscription`

**Authentication:** JWT token or API key required

**Success Response (200 OK):**
```json
{
  "plan": "free",
  "status": "active",
  "iam_count": 3,
  "iam_limit": 10,
  "current_period_end": null
}
```

| Field | Type | Description |
|-------|------|-------------|
| `plan` | string | Current plan: `"free"`, `"standard"`, or `"pro"` |
| `status` | string | Subscription status: `"active"`, `"past_due"`, or `"canceled"` |
| `iam_count` | integer | Number of models (IAMs) currently owned |
| `iam_limit` | integer | Max models allowed on this plan (10 / 100 / 1000) |
| `current_period_end` | string/null | ISO 8601 renewal date (null for free plan) |

**Example:**
```bash
curl -s http://localhost:8000/v1/billing/subscription \
  -H "Authorization: Bearer $API_KEY" | jq .
```

---

### Billing — Create Checkout Session

Create a Stripe Checkout session for upgrading to standard or pro. The client should redirect the user to the returned `checkout_url`.

**Endpoint:** `POST /v1/billing/checkout?plan=standard|pro`

**Authentication:** JWT token or API key required

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `plan` | string | Yes | Target plan: `"standard"` or `"pro"` |

**Success Response (200 OK):**
```json
{
  "checkout_url": "https://checkout.stripe.com/pay/cs_live_..."
}
```

**Error Responses:**

**400 Bad Request** - Invalid plan:
```json
{
  "detail": "plan must be 'standard' or 'pro'. Use GET /v1/billing/subscription to see current plan."
}
```

**Example:**
```bash
curl -s -X POST "http://localhost:8000/v1/billing/checkout?plan=standard" \
  -H "Authorization: Bearer $API_KEY" | jq -r '.checkout_url'
```

---

### Billing — Stripe Webhook

Webhook receiver for Stripe events. Verified via `Stripe-Signature` header — **no user authentication required** on this endpoint.

**Endpoint:** `POST /v1/billing/stripe-webhook`

**Authentication:** None (Stripe-signed)

Handled events:
- `checkout.session.completed` — primary subscription provisioning
- `customer.subscription.created` — secondary provisioning (manual/Dashboard subscriptions)
- `customer.subscription.updated` — upgrades, downgrades, renewals
- `customer.subscription.deleted` — downgrades user to free plan
- `invoice.payment_failed` — marks subscription as `past_due` (grace period)
- `invoice.payment_action_required` — marks subscription as `past_due`

**Success Response (200 OK):**
```json
{ "ok": true }
```

**Error Responses:**

**400 Bad Request** - Invalid Stripe signature:
```json
{ "detail": "Invalid webhook signature" }
```

---

### Billing — Cancel Subscription

Cancel the authenticated user's paid subscription at the end of the current billing period. Access continues until `current_period_end`.

**Endpoint:** `POST /v1/billing/subscription/cancel`

**Authentication:** JWT token or API key required

**Success Response (200 OK):**
```json
{
  "canceled_at_period_end": true,
  "current_period_end": "2026-03-18T12:00:00"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `canceled_at_period_end` | boolean | Always true on success |
| `current_period_end` | string/null | ISO 8601 date when access expires |

**Error Responses:**

**400 Bad Request** - No paid subscription:
```json
{
  "detail": "No active paid subscription found"
}
```

**Example:**
```bash
curl -s -X POST http://localhost:8000/v1/billing/subscription/cancel \
  -H "Authorization: Bearer $API_KEY" | jq .
```

---

### Anthropic Messages Proxy

Transparent proxy for the Anthropic Messages API. DeepSelf injects the persona profile into the `system` field, swaps in our system API key, and forwards the full request to Anthropic verbatim — streaming, tools, vision, and all other fields pass through unchanged.

**Endpoint:** `POST /v1/messages`

**Authentication:** JWT token or API key required

**Model field syntax:** `"iam_username@claude-model"` (e.g. `"jonny@claude-sonnet-4-6"`)

**Request Body:** Identical to the [Anthropic Messages API](https://docs.anthropic.com/en/api/messages), except the `model` field uses DeepSelf's `username@model` format. `max_tokens` defaults to `4096` if omitted (Anthropic requires it).

```json
{
  "model": "jonny@claude-sonnet-4-6",
  "max_tokens": 1024,
  "messages": [
    {"role": "user", "content": "Tell me about yourself"}
  ]
}
```

**Response:** Verbatim Anthropic API response (non-streaming or SSE stream).

**Error Responses:**

**400 Bad Request** - Non-Anthropic model sent to this endpoint:
```json
{
  "detail": "Model 'gpt-4o' is not an Anthropic model. Use POST /v1/chat/completions for OpenAI/xAI models."
}
```

**400 Bad Request** - Missing `@` separator or unsupported model:
```json
{
  "detail": "model field must use 'iam_username@model' syntax (e.g. 'jonny@claude-sonnet-4-6')"
}
```

**402 Payment Required** - Insufficient balance:
```json
{
  "detail": "Insufficient balance. Please top up your account."
}
```

**Examples:**

Non-streaming:
```bash
curl -s http://localhost:8000/v1/messages \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "jonny@claude-sonnet-4-6",
    "max_tokens": 256,
    "messages": [{"role": "user", "content": "Tell me about yourself"}]
  }' | jq .
```

Streaming:
```bash
curl -s http://localhost:8000/v1/messages \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "jonny@claude-sonnet-4-6",
    "max_tokens": 256,
    "stream": true,
    "messages": [{"role": "user", "content": "Count to 5"}]
  }'
```

**Notes:**
- Token usage is billed post-response (or post-stream) against the caller's credit balance
- Profile is prepended to any existing `system` content; string system fields are prepended with `\n\n` separator; content-block arrays get a new text block prepended
- All other request fields (`tools`, `tool_choice`, `temperature`, etc.) pass through unchanged

---

### OpenAI Responses API Proxy

Transparent proxy for the OpenAI Responses API. DeepSelf injects the persona profile into the `instructions` field, swaps in our system API key, and forwards the request verbatim.

**Endpoint:** `POST /v1/responses`

**Authentication:** JWT token or API key required

**Model field syntax:** `"iam_username@openai-model"` (e.g. `"jonny@gpt-4o"`)

**Request Body:** Identical to the [OpenAI Responses API](https://platform.openai.com/docs/api-reference/responses), except the `model` field uses DeepSelf's `username@model` format.

```json
{
  "model": "jonny@gpt-4o",
  "input": "Tell me about yourself"
}
```

**Response:** Verbatim OpenAI API response (non-streaming or SSE stream).

**Error Responses:**

**400 Bad Request** - Anthropic model sent to this endpoint:
```json
{
  "detail": "Model 'claude-sonnet-4-6' is not supported at /v1/responses. Use POST /v1/messages for Anthropic models."
}
```

**402 Payment Required** - Insufficient balance:
```json
{
  "detail": "Insufficient balance. Please top up your account."
}
```

**Examples:**

Non-streaming:
```bash
curl -s http://localhost:8000/v1/responses \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "jonny@gpt-4o",
    "input": "Tell me about yourself"
  }' | jq .
```

Streaming:
```bash
curl -s http://localhost:8000/v1/responses \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "jonny@gpt-4o",
    "stream": true,
    "input": "Count to 5"
  }'
```

**Notes:**
- Profile is prepended to any existing `instructions` content with a `\n\n` separator
- All other request fields (`tools`, `temperature`, `max_output_tokens`, etc.) pass through unchanged
- Token usage is billed post-response; usage is extracted from the `response.completed` SSE event for streams
