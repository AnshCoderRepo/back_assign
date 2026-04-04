import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_in_production';

export interface AuthUser {
  id: string;
  role: 'ADMIN' | 'ANALYST' | 'VIEWER';
}

export function extractUserFromRequest(request: NextRequest): AuthUser | null {
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
}

export function checkRole(user: AuthUser | null, allowedRoles: string[]) {
  if (!user) return false;
  return allowedRoles.includes(user.role);
}

export function authMiddleware(allowedRoles: string[]) {
  return async (request: NextRequest, handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>) => {
    const user = extractUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please provide a valid token.' }, { status: 401 });
    }

    if (!checkRole(user, allowedRoles)) {
      return NextResponse.json({ error: 'Forbidden. You do not have the required role to access this resource.' }, { status: 403 });
    }

    return handler(request, user);
  };
}
