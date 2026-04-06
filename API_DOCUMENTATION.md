# Finova Backend API Documentation

## Overview

Finova is a comprehensive financial management system built with Next.js 16, providing secure API endpoints for managing financial records, user authentication, and dashboard analytics. The API features role-based access control (RBAC), robust input validation, rate limiting, and advanced MongoDB aggregation capabilities.




### User Roles & Permissions
- **ADMIN**: Full CRUD operations on records and users, complete dashboard access
- **ANALYST**: Read-only access to records and dashboard analytics
- **VIEWER**: Read-only access to dashboard summaries

### Rate Limiting
- 60 requests per minute per IP address
- Returns `429 Too Many Requests` when exceeded

### Response Format
All responses follow a consistent JSON structure:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Common HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (duplicate resource)
- `429`: Too Many Requests
- `500`: Internal Server Error

---

## 1. Authentication Endpoints

### POST /auth/login
Authenticate a user and receive a JWT token.

**Access:** Public

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
*Note: You can also use `username` instead of `email` for login.*

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "ADMIN"
    }
  },
  "message": "Login successful"
}
```

**Error Responses:**
- `400`: Invalid credentials format
- `401`: Invalid credentials
- `403`: User account is inactive

### POST /auth/logout
Destroy the current user session.

**Access:** Authenticated users

**Request Body:** None

**Response (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Logged out successfully"
}
```

---

## 2. User Management Endpoints

### GET /users
Retrieve a list of all users.

**Access:** ADMIN only

**Query Parameters:** None

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "username": "johndoe",
      "role": "ADMIN",
      "status": "ACTIVE",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "message": "Users retrieved successfully"
}
```

### POST /users
Create a new user. The first user created automatically becomes an ADMIN.

**Access:** ADMIN (or public for first user creation)

**Request Body:**
```json
{
  "name": "Jane Smith",
  "identifier": "jane@example.com", // or username
  "password": "securepassword123",
  "role": "ANALYST", // optional, defaults to VIEWER
  "status": "ACTIVE" // optional, defaults to ACTIVE
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "ANALYST",
    "status": "ACTIVE",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "User created successfully"
}
```

### GET /users/:id
Retrieve a specific user by ID.

**Access:** ADMIN only

**URL Parameters:**
- `id`: User ID (24-character MongoDB ObjectId)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "ADMIN",
    "status": "ACTIVE",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "User retrieved successfully"
}
```

### PUT /users/:id
Update an existing user.

**Access:** ADMIN only

**URL Parameters:**
- `id`: User ID

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Name",
  "identifier": "newemail@example.com",
  "role": "VIEWER",
  "status": "INACTIVE",
  "password": "newpassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Updated Name",
    "email": "newemail@example.com",
    "role": "VIEWER",
    "status": "INACTIVE",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "User updated successfully"
}
```

### DELETE /users/:id
Delete a user permanently.

**Access:** ADMIN only

**URL Parameters:**
- `id`: User ID

**Response (200):**
```json
{
  "success": true,
  "data": null,
  "message": "User deleted successfully"
}
```

**Error Responses:**
- `400`: Cannot delete the last admin user
- `400`: Cannot delete your own account

---

## 3. Financial Records Endpoints

### GET /records
Retrieve paginated list of financial records.

**Access:** ADMIN, ANALYST, VIEWER

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)
- `type` (string): Filter by "INCOME" or "EXPENSE"
- `category` (string): Filter by category name
- `startDate` (string): Start date (ISO format)
- `endDate` (string): End date (ISO format)
- `search` (string): Search in descriptions

**Response (200):**
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "507f1f77bcf86cd799439013",
        "amount": 1500.00,
        "type": "INCOME",
        "category": "Salary",
        "date": "2024-01-15T00:00:00.000Z",
        "description": "Monthly salary",
        "createdBy": {
          "name": "John Doe",
          "email": "john@example.com"
        },
        "createdAt": "2024-01-15T10:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  },
  "message": "Records retrieved successfully"
}
```

### POST /records
Create a new financial record.

**Access:** ADMIN only

**Request Body:**
```json
{
  "amount": 250.75,
  "type": "EXPENSE",
  "category": "Office Supplies",
  "date": "2024-01-15",
  "description": "Printer paper and ink"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439014",
    "amount": 250.75,
    "type": "EXPENSE",
    "category": "Office Supplies",
    "date": "2024-01-15T00:00:00.000Z",
    "description": "Printer paper and ink",
    "createdBy": "507f1f77bcf86cd799439011",
    "createdAt": "2024-01-15T12:00:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  },
  "message": "Record created successfully"
}
```

### PUT /records/:id
Update an existing record.

**Access:** ADMIN only

**URL Parameters:**
- `id`: Record ID

**Request Body:** (all fields optional)
```json
{
  "amount": 275.00,
  "category": "Office Equipment",
  "description": "Updated description"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439014",
    "amount": 275.00,
    "type": "EXPENSE",
    "category": "Office Equipment",
    "date": "2024-01-15T00:00:00.000Z",
    "description": "Updated description",
    "createdBy": "507f1f77bcf86cd799439011",
    "createdAt": "2024-01-15T12:00:00.000Z",
    "updatedAt": "2024-01-15T12:30:00.000Z"
  },
  "message": "Record updated successfully"
}
```

### DELETE /records/:id
Soft-delete a record (marks as deleted, doesn't remove from database).

**Access:** ADMIN only

**URL Parameters:**
- `id`: Record ID

**Response (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Record deleted successfully"
}
```

---

## 4. Dashboard Analytics Endpoints

### GET /dashboard/summary
Get comprehensive financial summary including totals, category breakdowns, and monthly trends.

**Access:** ADMIN, ANALYST, VIEWER

**Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalIncome": 15000.00,
      "totalExpense": 8500.00,
      "balance": 6500.00,
      "categoryTotals": [
        {
          "type": "INCOME",
          "category": "Salary",
          "total": 15000.00
        },
        {
          "type": "EXPENSE",
          "category": "Office Supplies",
          "total": 250.75
        }
      ],
      "monthlyTrends": [
        {
          "year": 2024,
          "month": 1,
          "type": "INCOME",
          "total": 15000.00
        },
        {
          "year": 2024,
          "month": 1,
          "type": "EXPENSE",
          "total": 250.75
        }
      ]
    }
  },
  "message": "Dashboard summary retrieved successfully"
}
```

### GET /dashboard/recent
Get the 5 most recent financial records.

**Access:** ADMIN, ANALYST, VIEWER

**Response (200):**
```json
{
  "success": true,
  "data": {
    "recentRecords": [
      {
        "id": "507f1f77bcf86cd799439014",
        "amount": 250.75,
        "type": "EXPENSE",
        "category": "Office Supplies",
        "date": "2024-01-15T00:00:00.000Z",
        "description": "Printer paper and ink",
        "createdBy": {
          "name": "John Doe",
          "email": "john@example.com"
        },
        "createdAt": "2024-01-15T12:00:00.000Z"
      }
    ]
  },
  "message": "Recent records retrieved successfully"
}
```

### GET /dashboard/category
Get financial totals grouped by category and type.

**Access:** ADMIN, ANALYST, VIEWER

**Query Parameters:**
- `type` (string): Filter by "INCOME" or "EXPENSE" (optional)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "categorySummary": [
      {
        "_id": "INCOME",
        "categories": [
          {
            "category": "Salary",
            "total": 15000.00
          }
        ]
      },
      {
        "_id": "EXPENSE",
        "categories": [
          {
            "category": "Office Supplies",
            "total": 250.75
          }
        ]
      }
    ]
  }
}
```

### GET /dashboard/monthly
Get monthly financial summary for a specific year.

**Access:** ADMIN, ANALYST, VIEWER

**Query Parameters:**
- `year` (number): Year to retrieve data for (default: current year)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "year": 2024,
    "monthlySummary": [
      {
        "_id": 1,
        "data": [
          {
            "type": "INCOME",
            "total": 15000.00
          },
          {
            "type": "EXPENSE",
            "total": 250.75
          }
        ]
      }
    ]
  }
}
```

---

## Data Models

### User
```typescript
{
  id: string; // MongoDB ObjectId
  name: string;
  username?: string;
  email?: string;
  password: string; // Hashed, not returned in responses
  role: 'ADMIN' | 'ANALYST' | 'VIEWER';
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}
```

### Financial Record
```typescript
{
  id: string; // MongoDB ObjectId
  amount: number; // > 0
  type: 'INCOME' | 'EXPENSE';
  category: string;
  date: Date;
  description?: string;
  isDeleted: boolean; // Soft delete flag
  createdBy: string; // User ID
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `AUTH_REQUIRED` | Authentication token missing or invalid |
| `INSUFFICIENT_PERMISSIONS` | User doesn't have required role |
| `VALIDATION_ERROR` | Input validation failed |
| `DUPLICATE_ERROR` | Resource already exists |
| `DATABASE_ERROR` | Database operation failed |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_ERROR` | Unexpected server error |

---

## Validation Rules

- **Email**: Must be valid email format
- **Username**: 3-20 characters, alphanumeric + `._-`
- **Password**: Minimum 6 characters (recommended)
- **Amount**: Must be positive number > 0
- **Type**: Must be "INCOME" or "EXPENSE"
- **ObjectId**: Must be 24-character hexadecimal string
- **Date**: ISO date string or Date object

---

## Security Features

- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: IP-based request throttling
- **Input Validation**: Comprehensive validation on all inputs
- **SQL Injection Protection**: MongoDB/Mongoose ORM
- **XSS Protection**: Proper input sanitization
- **CORS**: Configured for cross-origin requests
- **HTTPS**: Recommended for production

---

## Development Notes

- All endpoints are wrapped with `withApiHandler` for consistent error handling
- Database operations use `withDb` wrapper for error handling
- Authentication is checked on protected routes
- Soft deletes preserve audit history
- Aggregation pipelines optimize dashboard queries
- Pagination prevents large result sets

For questions or support, please refer to the main README.md file.
