#!/bin/bash

# Debug script for user update issues
echo "🔍 Debugging User Update Issues"
echo "================================="

# Check if MongoDB is running and accessible
echo "1. Checking MongoDB connection..."
if ! curl -s http://localhost:27017 > /dev/null; then
    echo "❌ MongoDB is not running on localhost:27017"
    echo "   Please start MongoDB:"
    echo "   - macOS: brew services start mongodb/brew/mongodb-community"
    echo "   - Docker: docker run -d -p 27017:27017 --name mongodb mongo:latest"
    exit 1
else
    echo "✅ MongoDB is running"
fi

# Check if Next.js is running
echo ""
echo "2. Checking if Next.js server is running..."
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Next.js server is not running on localhost:3000"
    echo "   Please start the server:"
    echo "   npm run dev"
    exit 1
else
    echo "✅ Next.js server is running"
fi

# Test user creation
echo ""
echo "3. Testing user creation..."
CREATE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "identifier": "test@example.com",
    "password": "testpass123",
    "role": "ANALYST"
  }')

if echo "$CREATE_RESPONSE" | grep -q '"success":true'; then
    echo "✅ User creation successful"
    USER_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    echo "   User ID: $USER_ID"
else
    echo "❌ User creation failed:"
    echo "$CREATE_RESPONSE"
    exit 1
fi

# Test user retrieval
echo ""
echo "4. Testing user retrieval..."
GET_RESPONSE=$(curl -s -X GET "http://localhost:3000/api/users/$USER_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE")

if echo "$GET_RESPONSE" | grep -q '"success":true'; then
    echo "✅ User retrieval successful"
else
    echo "❌ User retrieval failed:"
    echo "$GET_RESPONSE"
    echo ""
    echo "💡 Possible issues:"
    echo "   - Invalid User ID format: $USER_ID"
    echo "   - Missing admin authentication token"
    echo "   - User was not created successfully"
fi

# Test password update
echo ""
echo "5. Testing password update..."
UPDATE_RESPONSE=$(curl -s -X PUT "http://localhost:3000/api/users/$USER_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE" \
  -d '{
    "password": "newpassword123"
  }')

if echo "$UPDATE_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Password update successful"
else
    echo "❌ Password update failed:"
    echo "$UPDATE_RESPONSE"
    echo ""
    echo "💡 Common issues:"
    echo "   - Invalid User ID: $USER_ID (should be 24-character hex)"
    echo "   - Missing admin authentication"
    echo "   - Password too short (minimum 6 characters)"
    echo "   - User doesn't exist in database"
fi

echo ""
echo "🔧 Troubleshooting Tips:"
echo "1. Replace 'YOUR_ADMIN_TOKEN_HERE' with a valid admin JWT token"
echo "2. Check the User ID format - should be 24 hexadecimal characters"
echo "3. Verify the user exists by checking GET /api/users"
echo "4. Check server logs for detailed error messages"
echo "5. Ensure MongoDB connection string is correct in .env"

echo ""
echo "📝 To get an admin token:"
echo "1. Create/login as admin user via POST /api/auth/login"
echo "2. Copy the token from the response"
echo "3. Use it in Authorization header: 'Bearer <token>'"