import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcrypt';
import { auth, validate, withDb, withApiHandler, apiResponse } from '@/lib/api-utils';

export const GET = withApiHandler(async (request: NextRequest) => {
  const user = auth.requireRoles(request, ['ADMIN']);

  await connectToDatabase();

  const users = await withDb(
    () => User.find().select('-password').sort({ createdAt: -1 }),
    'Failed to fetch users'
  );

  return apiResponse.success(users, 'Users retrieved successfully');
});

export const POST = withApiHandler(async (request: NextRequest) => {
  await connectToDatabase();

  // Check if any users exist for first user creation
  const userCount = await withDb(
    () => User.countDocuments(),
    'Failed to check user count'
  );

  let authenticatedUser: any = null;
  if (userCount > 0) {
    authenticatedUser = auth.requireRoles(request, ['ADMIN']);
  }

  const { name, email, password, role, status } = await request.json();

  // Validate input
  validate.required(name, 'Name');
  validate.required(email, 'Email');
  validate.required(password, 'Password');
  validate.email(email);

  if (role) {
    validate.oneOf(role, ['ADMIN', 'ANALYST', 'VIEWER'], 'role');
  }

  if (status) {
    validate.oneOf(status, ['ACTIVE', 'INACTIVE'], 'status');
  }

  // Check for existing user
  const existingUser = await withDb(
    () => User.findOne({ email }),
    'Failed to check existing user'
  );

  if (existingUser) {
    throw new Error('Email already in use');
  }

  // Hash password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create user
  const newUser = await withDb(
    () => User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: userCount === 0 ? 'ADMIN' : (role || 'VIEWER'),
      status: status || 'ACTIVE',
    }),
    'Failed to create user'
  );

  const userResponse = {
    id: newUser._id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    status: newUser.status,
    createdAt: newUser.createdAt,
  };

  const message = userCount === 0
    ? 'First admin user created successfully'
    : 'User created successfully';

  return apiResponse.success(userResponse, message);
});
