# Finance Portal

A full-stack finance management application built with Next.js, featuring user authentication, financial record management, and dashboard analytics.

## Features

- **User Authentication**: JWT-based login with role-based access control (Admin, Analyst, Viewer)
- **Financial Records**: Create and manage income/expense records with categories
- **Dashboard**: Real-time financial summaries and recent transaction views
- **Responsive Design**: Modern UI with dark mode support

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with bcrypt password hashing

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or cloud instance)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd back_assign
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up MongoDB**
   - Install MongoDB locally or use a cloud service like MongoDB Atlas
   - Update the `MONGODB_URI` in `.env` if needed (default: `mongodb://localhost:27017/finance`)

4. **Configure environment variables**
   - The `.env` file is already configured with default values
   - `MONGODB_URI`: MongoDB connection string
   - `JWT_SECRET`: Secret key for JWT tokens

5. **Start MongoDB** (if running locally)
   ```bash
   # On macOS with Homebrew
   brew services start mongodb/brew/mongodb-community

   # Or use Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   - Navigate to [http://localhost:3000](http://localhost:3000)

## First Time Setup

1. **Create the first admin account**:
   - On the login page, click "Sign Up"
   - Fill in your details (name, email, password)
   - The first user created will automatically become an Admin
   - After registration, use "Sign In" to login

2. **Create additional users** (Admin only):
   - Login as Admin
   - Use the API endpoints or extend the UI to create more users

## API Endpoints

- `POST /api/auth/login` - User authentication
- `POST /api/users` - Create new user (first user becomes Admin)
- `GET /api/users` - List users (Admin only)
- `POST /api/records` - Create financial record
- `GET /api/records` - List records
- `GET /api/dashboard/summary` - Financial summary
- `GET /api/dashboard/recent` - Recent records
- `GET /api/dashboard/category` - Records by category
- `GET /api/dashboard/monthly` - Monthly breakdown

## User Roles

- **Admin**: Full access, can create users and manage all records
- **Analyst**: Can view dashboard and records
- **Viewer**: Read-only access to records

## Development

- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

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

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
