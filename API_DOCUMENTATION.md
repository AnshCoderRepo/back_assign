# Finova Backend API Documentation

## Overview
This backend powers the Finova financial dashboard. It is a full-featured REST API with Role-Based Access Control (RBAC), robust input validation, secure caching, soft deletion, and advanced Mongoose aggregation capabilities.

### Base URL
All API requests must be prefixed with `/api`.

### Authentication & Authorization
The API uses Bearer tokens (JWT). Include the token in the `Authorization` header:
`Authorization: Bearer <your_jwt_token>`

Roles:
- **[ADMIN]**: Full CRUD capability over records and user management.
- **[ANALYST]**: Read-only access to records and analytical aggregates.
- **[VIEWER]**: Read-only access exclusively to the home dashboard.

---

## 1. Authentication Endpoints

### `POST /auth/login`
Authenticates a user and generates a JWT.
- **Request Body**: `{ "email": "admin@example.com", "password": "password" }`
- **Access**: Public

### `POST /auth/logout`
Destroys the current user session cookies.
- **Access**: Protected

---

## 2. Records Endpoints

### `GET /records`
Retrieves a paginated list of financial records. Implements soft-delete filtering so deleted records are omitted.
- **Access**: `[ADMIN]`, `[ANALYST]`, `[VIEWER]`
- **Query Parameters**:
  - `page` (number): Pagination page (default: 1)
  - `limit` (number): Items per page (default: 10)
  - `search` (string): Text search against descriptions
  - `type` ("INCOME" | "EXPENSE"): Filter by transaction type
  - `category` (string): Filter by transaction category

### `POST /records`
Creates a newly recorded transaction.
- **Access**: `[ADMIN]`
- **Request Body**: `{ "amount": 150.00, "type": "INCOME", "category": "Sales", "description": "Notes", "date": "2023-10-01" }`

### `PUT /records/:id`
Selectively updates an existing database transaction. Validates against empty data.
- **Access**: `[ADMIN]`
- **Request Body**: Any valid fields provided in POST body.

### `DELETE /records/:id`
Soft-deletes a record so that it is no longer shown in queries, but mathematically preserves audit history.
- **Access**: `[ADMIN]`

---

## 3. Dashboard Aggregations

### `GET /dashboard/summary`
Core aggregation endpoint that outputs total balance, total income, total expense, category-wise breakdowns, and 6-month historical trends.
- **Access**: `[ADMIN]`, `[ANALYST]`, `[VIEWER]`

### `GET /dashboard/recent`
Fetches a chronological list of recent (not-deleted) activities across the organization.
- **Access**: `[ADMIN]`, `[ANALYST]`, `[VIEWER]`

---

## Notes
- **Rate Limiting**: Automatic IP-based tracking caps activity to prevent DDoS/Bruteforce attempts. Expect `429 Too Many Requests` when limits are exceeded.
- **Validation**: All endpoints are strictly typed with the central `api-utils.ts` wrapper. Malformed requests will yield a `400 Bad Request`.
