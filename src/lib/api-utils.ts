import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_in_production';

export interface AuthUser {
  id: string;
  role: 'ADMIN' | 'ANALYST' | 'VIEWER';
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Standardized API response helpers
export const apiResponse = {
  success: <T>(data: T, message?: string): NextResponse<ApiResponse<T>> => {
    return NextResponse.json({
      success: true,
      data,
      message
    });
  },

  error: (message: string, statusCode: number = 500, code?: string): NextResponse<ApiResponse> => {
    return NextResponse.json({
      success: false,
      error: message,
      ...(code && { code })
    }, { status: statusCode });
  }
};

// Authentication utilities
export const auth = {
  extractUser: (request: NextRequest): AuthUser | null => {
    try {
      let token = '';
      
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else {
        const cookieToken = request.cookies.get('token')?.value;
        if (cookieToken) {
          token = cookieToken;
        }
      }

      if (!token) {
        return null;
      }

      const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;

      return decoded;
    } catch (error) {
      return null;
    }
  },

  requireAuth: (request: NextRequest): AuthUser => {
    const user = auth.extractUser(request);
    if (!user) {
      throw new ApiError(401, 'Authentication required', 'AUTH_REQUIRED');
    }
    return user;
  },

  requireRole: (user: AuthUser, allowedRoles: string[]): void => {
    if (!allowedRoles.includes(user.role)) {
      throw new ApiError(403, 'Insufficient permissions', 'INSUFFICIENT_PERMISSIONS');
    }
  },

  requireRoles: (request: NextRequest, allowedRoles: string[]): AuthUser => {
    const user = auth.requireAuth(request);
    auth.requireRole(user, allowedRoles);
    return user;
  }
};

// Input validation helpers
export const validate = {
  required: (value: any, fieldName: string): void => {
    if (value === undefined || value === null || value === '') {
      throw new ApiError(400, `${fieldName} is required`, 'VALIDATION_ERROR');
    }
  },

  email: (email: string): void => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ApiError(400, 'Invalid email format', 'VALIDATION_ERROR');
    }
  },

  username: (username: string): void => {
    const usernameRegex = /^[a-zA-Z0-9_.-]{3,20}$/;
    if (!usernameRegex.test(username)) {
      throw new ApiError(400, 'Username must be 3-20 characters long and can only contain letters, numbers, periods, dashes, and underscores.', 'VALIDATION_ERROR');
    }
  },

  oneOf: (value: any, allowedValues: any[], fieldName: string): void => {
    if (!allowedValues.includes(value)) {
      throw new ApiError(400, `Invalid ${fieldName}. Must be one of: ${allowedValues.join(', ')}`, 'VALIDATION_ERROR');
    }
  },

  positiveNumber: (value: number, fieldName: string): void => {
    if (typeof value !== 'number' || value <= 0) {
      throw new ApiError(400, `${fieldName} must be a positive number`, 'VALIDATION_ERROR');
    }
  }
};

// Database operation wrapper with error handling
export const withDb = async <T>(
  operation: () => Promise<T>,
  errorMessage: string = 'Database operation failed'
): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    console.error('Database error:', error);

    // Handle specific database errors
    if (error.code === 11000) {
      throw new ApiError(409, 'Resource already exists', 'DUPLICATE_ERROR');
    }

    if (error.name === 'ValidationError') {
      throw new ApiError(400, 'Invalid data provided', 'VALIDATION_ERROR');
    }

    throw new ApiError(500, errorMessage, 'DATABASE_ERROR');
  }
};

// API route wrapper for consistent error handling
export const withApiHandler = (
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) => {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof ApiError) {
        return apiResponse.error(error.message, error.statusCode, error.code);
      }

      console.error('Unhandled error:', error);
      return apiResponse.error(error instanceof Error ? error.message : 'Internal server error', 500, 'INTERNAL_ERROR');
    }
  };
};