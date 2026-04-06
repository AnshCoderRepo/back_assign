# Validation Testing Guide

This document provides comprehensive validation rules and test cases for the Finova API. Use this guide to thoroughly test input validation across all endpoints.

## Validation Rules Overview

| Field | Rule | Example Valid | Example Invalid |
|-------|------|---|---|
| **Email** | Valid email format | `user@example.com` | `invalid-email`, `user@.com` |
| **Username** | 3-20 chars, alphanumeric + `._-` | `john_doe`, `user.123`, `test-user` | `ab` (too short), `user@123` (invalid char) |
| **Password** | Minimum 6 characters | `MyPass123`, `secure!pass` | `pass`, `123` |
| **Amount** | Positive number > 0 | `100.50`, `1000` | `0`, `-50`, `abc` |
| **Type** | Must be "INCOME" or "EXPENSE" | `"INCOME"`, `"EXPENSE"` | `"income"`, `"OTHER"` |
| **ObjectId** | 24-char hexadecimal string | `507f1f77bcf86cd799439011` | `507f1f77bcf86cd799`, `507f1f77bcf86cd79943901g` |
| **Date** | ISO date string or Date object | `2024-01-15`, `2024-01-15T10:30:00Z` | `15-01-2024`, `invalid-date` |

---

## 1. Email Validation

### Valid Email Formats
```bash
# Valid emails
user@example.com
john.doe@company.co.uk
test+tag@domain.org
user_123@mail.com
```

### Invalid Email Formats
```bash
# Invalid emails - missing @ symbol
userexample.com

# Invalid emails - missing domain
user@

# Invalid emails - missing local part
@example.com

# Invalid emails - space in email
user @example.com
```

### Test Cases

#### Endpoint: POST /api/users
```bash
# ✅ Valid Email
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "identifier": "john@example.com",
    "password": "securepass123",
    "role": "ANALYST"
  }'

# ❌ Invalid Email - Missing @
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "identifier": "janeexample.com",
    "password": "securepass123"
  }'
# Expected Response: 400 Bad Request - "Invalid email format"
```

---

## 2. Username Validation

### Valid Username Formats
```
Requirements: 3-20 characters, alphanumeric + dots, underscores, hyphens
```

Valid examples:
- `john_doe` (8 chars, contains underscore)
- `user.123` (8 chars, contains dot)
- `test-user` (9 chars, contains hyphen)
- `abc` (3 chars minimum)
- `a1b2c3d4e5f6g7h8i9j0` (20 chars maximum)

Invalid examples:
- `ab` (2 chars, too short)
- `user@123` (contains invalid character @)
- `john doe` (contains space)
- `verylongusernamethatexceedstwentychars` (>20 chars)

### Test Cases

```bash
# ✅ Valid Username
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "identifier": "john_doe",
    "password": "securepass123"
  }'

# ❌ Invalid Username - Too Short
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "identifier": "ab",
    "password": "securepass123"
  }'
# Expected Response: 400 Bad Request - "Username must be 3-20 characters..."

# ❌ Invalid Username - Special Character
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "identifier": "user@123",
    "password": "securepass123"
  }'
# Expected Response: 400 Bad Request - "Username must be 3-20 characters..."
```

---

## 3. Password Validation

### Requirements
- Minimum 6 characters
- Recommended: Mix of uppercase, lowercase, numbers, special characters

### Valid Passwords
```
MyPass123
secure!pass
Password1
test@2024
```

### Invalid Passwords
```
pass      (5 chars)
123       (3 chars)
abc       (3 chars)
```

### Test Cases

```bash
# ✅ Valid Password
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "identifier": "john@example.com",
    "password": "securepass123"
  }'

# ❌ Invalid Password - Too Short
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "identifier": "jane@example.com",
    "password": "pass"
  }'
# Expected Response: 400 Bad Request - "Password must be at least 6 characters long"

# ✅ Login with Valid Password
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepass123"
  }'

# ❌ Login with Invalid Password - Too Short
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "pass"
  }'
# Expected Response: 400 Bad Request - "Password must be at least 6 characters long"
```

---

## 4. Amount Validation

### Requirements
- Must be a positive number
- Amount > 0
- Support decimal values (e.g., 100.50)

### Valid Amounts
```
100
100.50
1000.99
0.01
```

### Invalid Amounts
```
0 (zero is not allowed)
-50 (negative not allowed)
abc (not a number)
-100.50 (negative not allowed)
```

### Test Cases

```bash
# ✅ Valid Amount - INCOME
curl -X POST http://localhost:3000/api/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "amount": 1500.50,
    "type": "INCOME",
    "category": "Salary",
    "date": "2024-01-15",
    "description": "Monthly salary"
  }'

# ❌ Invalid Amount - Zero
curl -X POST http://localhost:3000/api/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "amount": 0,
    "type": "EXPENSE",
    "category": "Office Supplies"
  }'
# Expected Response: 400 Bad Request - "amount must be a positive number"

# ❌ Invalid Amount - Negative
curl -X POST http://localhost:3000/api/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "amount": -100,
    "type": "EXPENSE",
    "category": "Office Supplies"
  }'
# Expected Response: 400 Bad Request - "amount must be a positive number"

# ❌ Invalid Amount - Not a Number
curl -X POST http://localhost:3000/api/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "amount": "abc",
    "type": "EXPENSE",
    "category": "Office Supplies"
  }'
# Expected Response: 400 Bad Request - "amount must be a positive number"
```

---

## 5. Type Validation (INCOME/EXPENSE)

### Requirements
- Must be exactly "INCOME" or "EXPENSE"
- Case-sensitive
- No other values allowed

### Valid Values
```
"INCOME"
"EXPENSE"
```

### Invalid Values
```
"income" (wrong case)
"Income" (wrong case)
"REVENUE" (invalid value)
"expense" (wrong case)
income (not a string)
```

### Test Cases

```bash
# ✅ Valid Type - INCOME
curl -X POST http://localhost:3000/api/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "amount": 1500,
    "type": "INCOME",
    "category": "Salary"
  }'

# ❌ Invalid Type - Lowercase
curl -X POST http://localhost:3000/api/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "amount": 1500,
    "type": "income",
    "category": "Salary"
  }'
# Expected Response: 400 Bad Request - "Invalid type. Must be one of: INCOME, EXPENSE"

# ❌ Invalid Type - Wrong Value
curl -X POST http://localhost:3000/api/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "amount": 100,
    "type": "REVENUE",
    "category": "Sales"
  }'
# Expected Response: 400 Bad Request - "Invalid type. Must be one of: INCOME, EXPENSE"
```

---

## 6. ObjectId Validation

### Requirements
- Must be 24-character hexadecimal string
- Valid MongoDB ObjectId format

### Valid ObjectIds
```
507f1f77bcf86cd799439011
507f1f77bcf86cd799439012
5f6d0d5e2c3a3a3a3a3a3a3a
```

### Invalid ObjectIds
```
507f1f77bcf86cd799          (too short - 20 chars)
507f1f77bcf86cd79943901g    (contains 'g' - not hex)
507f1f77bcf86cd799439011aa  (too long - 26 chars)
not-an-objectid             (not hex format)
```

### Test Cases

```bash
# ✅ Valid ObjectId - Get User
curl -X GET http://localhost:3000/api/users/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_TOKEN"

# ❌ Invalid ObjectId - Too Short
curl -X GET http://localhost:3000/api/users/507f1f77bcf86cd799 \
  -H "Authorization: Bearer YOUR_TOKEN"
# Expected Response: 400 Bad Request - "Invalid ID format"

# ❌ Invalid ObjectId - Invalid Character
curl -X GET http://localhost:3000/api/users/507f1f77bcf86cd79943901g \
  -H "Authorization: Bearer YOUR_TOKEN"
# Expected Response: 400 Bad Request - "Invalid ID format"

# ✅ Valid ObjectId - Update Record
curl -X PUT http://localhost:3000/api/records/507f1f77bcf86cd799439013 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "amount": 250.75
  }'

# ❌ Invalid ObjectId - Update Record
curl -X PUT http://localhost:3000/api/records/invalid-id \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "amount": 250.75
  }'
# Expected Response: 400 Bad Request - "Invalid Record ID format"
```

---

## 7. Date Validation

### Requirements
- Must be ISO date string or Date object
- Valid date format
- Examples: "2024-01-15", "2024-01-15T10:30:00Z", "2024-01-15T10:30:00"

### Valid Dates
```
"2024-01-15"
"2024-01-15T10:30:00Z"
"2024-01-15T10:30:00"
"2024-12-31T23:59:59Z"
```

### Invalid Dates
```
"15-01-2024"        (wrong format)
"2024/01/15"        (wrong format)
"invalid-date"      (not a date)
"2024-13-01"        (invalid month)
"2024-01-32"        (invalid day)
```

### Test Cases

```bash
# ✅ Valid Date - ISO Format
curl -X POST http://localhost:3000/api/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "amount": 100,
    "type": "EXPENSE",
    "category": "Groceries",
    "date": "2024-01-15"
  }'

# ✅ Valid Date - ISO DateTime Format
curl -X POST http://localhost:3000/api/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "amount": 100,
    "type": "EXPENSE",
    "category": "Groceries",
    "date": "2024-01-15T10:30:00Z"
  }'

# ❌ Invalid Date - Wrong Format (D-M-Y)
curl -X POST http://localhost:3000/api/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "amount": 100,
    "type": "EXPENSE",
    "category": "Groceries",
    "date": "15-01-2024"
  }'
# Expected Response: 400 Bad Request - "Invalid date format"

# ❌ Invalid Date - Invalid Month
curl -X POST http://localhost:3000/api/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "amount": 100,
    "type": "EXPENSE",
    "category": "Groceries",
    "date": "2024-13-01"
  }'
# Expected Response: 400 Bad Request - "Invalid date format"

# ✅ Valid Date - Update Record
curl -X PUT http://localhost:3000/api/records/507f1f77bcf86cd799439013 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "date": "2024-02-20T14:30:00Z"
  }'
```

---

## Error Response Format

All validation errors follow this standardized format:

```json
{
  "success": false,
  "error": "Specific error message",
  "code": "VALIDATION_ERROR"
}
```

### Example Error Responses

```json
{
  "success": false,
  "error": "Password must be at least 6 characters long",
  "code": "VALIDATION_ERROR"
}
```

```json
{
  "success": false,
  "error": "Invalid email format",
  "code": "VALIDATION_ERROR"
}
```

```json
{
  "success": false,
  "error": "amount must be a positive number",
  "code": "VALIDATION_ERROR"
}
```

---

## Testing Checklist

### Email Validation
- [ ] Test with valid email format
- [ ] Test with missing @ symbol
- [ ] Test with missing domain
- [ ] Test with space in email
- [ ] Test with multiple @ symbols

### Username Validation
- [ ] Test with 3-character username (minimum)
- [ ] Test with 20-character username (maximum)
- [ ] Test with 2-character username (too short)
- [ ] Test with 21+ character username (too long)
- [ ] Test with special characters (e.g., @, #, $)
- [ ] Test with allowed characters (dots, dashes, underscores)

### Password Validation
- [ ] Test with 6-character password (minimum)
- [ ] Test with 5-character password (too short)
- [ ] Test with long password (20+ chars)
- [ ] Test during user creation
- [ ] Test during login
- [ ] Test during user password update

### Amount Validation
- [ ] Test with positive integer (e.g., 100)
- [ ] Test with decimal value (e.g., 100.50)
- [ ] Test with zero (should fail)
- [ ] Test with negative value (should fail)
- [ ] Test with non-numeric value (should fail)
- [ ] Test with very large number
- [ ] Test with very small decimal (e.g., 0.01)

### Type Validation
- [ ] Test with "INCOME" (valid)
- [ ] Test with "EXPENSE" (valid)
- [ ] Test with "income" (lowercase - should fail)
- [ ] Test with "Income" (mixed case - should fail)
- [ ] Test with other values (e.g., "REVENUE", "COST" - should fail)

### ObjectId Validation
- [ ] Test with valid 24-char hex string
- [ ] Test with 23-char string (too short)
- [ ] Test with 25-char string (too long)
- [ ] Test with non-hex characters
- [ ] Test with valid ObjectId format

### Date Validation
- [ ] Test with ISO date (YYYY-MM-DD)
- [ ] Test with ISO datetime (YYYY-MM-DDTHH:mm:ssZ)
- [ ] Test with European format (DD-MM-YYYY - should fail)
- [ ] Test with US format (MM/DD/YYYY - should fail)
- [ ] Test with invalid month (13)
- [ ] Test with invalid day (32)
- [ ] Test with leap year date (2024-02-29)

---

## Automation Script

Use this script to run automated validation tests:

```bash
#!/bin/bash

# Run validation tests
echo "Running validation tests..."

# Test email validation
echo "Testing email validation..."
npm test -- api/users --testNamePattern="email"

# Test username validation
echo "Testing username validation..."
npm test -- api/users --testNamePattern="username"

# Test password validation
echo "Testing password validation..."
npm test -- api/auth --testNamePattern="password"

# Test amount validation
echo "Testing amount validation..."
npm test -- api/records --testNamePattern="amount"

# Test type validation
echo "Testing type validation..."
npm test -- api/records --testNamePattern="type"

# Test ObjectId validation
echo "Testing ObjectId validation..."
npm test -- api --testNamePattern="objectId"

# Test date validation
echo "Testing date validation..."
npm test -- api/records --testNamePattern="date"

echo "Validation tests completed!"
```

---

## Support & Questions

For questions about validation rules or testing procedures, please refer to the main [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) file or contact the development team.