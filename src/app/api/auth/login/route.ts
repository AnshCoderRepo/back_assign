import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { withApiHandler, apiResponse, validate, withDb, ApiError } from '@/lib/api-utils';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be defined in environment configuration');
}

export const POST = withApiHandler(async (request: NextRequest) => {
  const body = await request.json();
  const { email: identifier, password } = body;

  validate.required(identifier, 'Identifier');
  validate.required(password, 'Password');
  validate.password(password);

  await connectToDatabase();

  const searchParam = identifier.toLowerCase().trim();
  const user = await withDb(
    () => User.findOne({
      $or: [
        { email: searchParam },
        { username: searchParam }
      ]
    }).select('+password'),
    'Failed to fetch user'
  );
  
  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const isMatch = await bcrypt.compare(password, user.password!);
  
  if (!isMatch) {
    throw new ApiError(401, 'Invalid credentials');
  }

  if (user.status !== 'ACTIVE') {
    throw new ApiError(403, 'User is inactive');
  }

  const token = jwt.sign(
    { id: user._id.toString(), role: user.role },
    JWT_SECRET,
    { expiresIn: '1d' }
  );

  const response = apiResponse.success({
    token, // Send token in body as well for clients that need it (or legacy reasons)
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  }, 'Login successful');

  response.cookies.set({
    name: 'token',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 // 1 day
  });

  return response;
});
