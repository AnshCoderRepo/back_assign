# Finova - Financial Management System

A comprehensive full-stack financial management application built with modern web technologies. Features secure  role-based access control, financial record management, and powerful dashboard analytics.

## ✨ Features

### 🔐 Security & Authentication
- **Role-Based Access Control** (RBAC) with three user roles
- **Password Security** with bcrypt hashing
- **Rate Limiting** to prevent abuse
- **Input Validation** and sanitization

### 💰 Financial Management
- **Income & Expense Tracking** with categorized records
- **Soft Delete** functionality preserving audit history
- **Advanced Filtering** by date, category, type, and search
- **Pagination** for efficient data handling
- **Real-time Dashboard** with financial summaries

### 📊 Analytics & Reporting
- **Financial Summary** with balance calculations
- **Category-wise Breakdowns** for spending analysis
- **Monthly Trends** with 6-month historical data
- **Recent Transactions** overview
- **Yearly Analytics** with monthly aggregations

### 👥 User Management
- **Multi-user Support** with granular permissions
- **User Lifecycle Management** (create, update, deactivate)
- **Admin Controls** for user administration
- **Profile Management** with secure updates

## 🏗️ Architecture

```
Finova/
├── Frontend (Next.js 16 + React 19)
│   ├── Pages: App Router with Server Components
│   ├── Styling: TailwindCSS 4
│   └── State: Server-side rendering
├── Backend (Next.js API Routes)
│   ├── Authentication: JWT with HTTP-only cookies
│   ├── Database: MongoDB with Mongoose ODM
│   ├── Validation: Centralized input validation
│   └── Security: Rate limiting & RBAC
└── Database (MongoDB Atlas)
    ├── Users Collection with role management
    ├── Records Collection with soft deletes
    └── Optimized aggregation pipelines
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0 or higher
- **MongoDB** (local installation or cloud service like MongoDB Atlas)
- **Git** for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/finova.git
   cd finova
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

## 📋 User Roles & Permissions

| Role | Description | Permissions |
|------|-------------|-------------|
| **ADMIN** | Full system access | Create/edit/delete users & records, view all analytics |
| **ANALYST** | Data analysis access | View records and analytics, read-only operations |
| **VIEWER** | Basic dashboard access | View dashboard summaries and recent transactions |



### Project Structure

```
finova/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API routes
│   │   ├── dashboard/      # Dashboard pages
│   │   ├── transactions/   # Transaction pages
│   │   └── users/          # User management pages
│   ├── lib/                # Utility libraries
│   │   ├── api-utils.ts    # API helpers & validation
│   │   ├── db.ts          # Database connection
│   │   └── services.ts     # Business logic
│   ├── models/            # Mongoose models
│   │   ├── User.ts        # User schema
│   │   └── Record.ts      # Financial record schema
│   └── middleware/        # Next.js middleware
├── public/                # Static assets
├── .env                   # Environment variables
├── tailwind.config.js     # TailwindCSS configuration
├── next.config.ts         # Next.js configuration
└── package.json           # Dependencies & scripts
```

### Code Quality

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting with Next.js rules
- **Prettier**: Code formatting (recommended)
- **Husky**: Pre-commit hooks for quality checks

```bash
# Build for production
npm run build

# Start production server
npm run start
```

## 📚 API Documentation

Comprehensive API documentation is available in [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md), including:

- Detailed endpoint specifications
- Request/response examples
- Authentication requirements
- Error handling
- Data models and validation rules

### Quick API Reference

```bash
# Authentication
POST /api/auth/login
POST /api/auth/logout

# Users (Admin only)
GET  /api/users
POST /api/users
GET  /api/users/:id
PUT  /api/users/:id
DELETE /api/users/:id

# Records
GET  /api/records
POST /api/records
PUT  /api/records/:id
DELETE /api/records/:id

# Dashboard
GET /api/dashboard/summary
GET /api/dashboard/recent
GET /api/dashboard/category
GET /api/dashboard/monthly
```

## 🔧 Configuration

### Database Configuration
- **Connection Pooling**: Automatic connection management
- **Indexes**: Optimized for query performance
- **Validation**: Schema-level data validation
- **Soft Deletes**: Preserves data integrity

### Security Configuration
- **CORS**: Configured for cross-origin requests
- **Helmet**: Security headers
- **Rate Limiting**: 60 requests/minute per IP
- **Input Sanitization**: XSS protection

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run e2e tests
npm run test:e2e
```
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests for new features
- Update documentation for API changes
- Ensure all tests pass before submitting PR
- Use conventional commit messages

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── api/          # API routes
│   │   ├── globals.css   # Global styles
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Main page
│   ├── lib/
│   │   └── db.ts         # Database connection
│   ├── middleware/
│   │   └── auth.ts       # Authentication middleware
│   └── models/           # MongoDB models
├── .env                  # Environment variables
└── package.json
```

