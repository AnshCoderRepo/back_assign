import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcrypt';
import { auth, validate, withDb, withApiHandler, apiResponse, ApiError } from '@/lib/api-utils';

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

  const { name, identifier, password, role, status } = await request.json();

  // Validate input
  validate.required(name, 'Name');
  validate.required(identifier, 'Email or Username');
  validate.required(password, 'Password');
  validate.password(password);

  let email: string | undefined;
  let username: string | undefined;

  if (identifier.includes('@')) {
    email = identifier;
    validate.email(identifier);
  } else {
    username = identifier;
    validate.username(identifier);
  }

  if (role) {
    validate.oneOf(role, ['ADMIN', 'ANALYST', 'VIEWER'], 'role');
  }

  if (status) {
    validate.oneOf(status, ['ACTIVE', 'INACTIVE'], 'status');
  }

  // Check for existing user by email or username
  const existingUser = await withDb(
    () => User.findOne({
      $or: [
        ...(email ? [{ email: email.toLowerCase().trim() }] : []),
        ...(username ? [{ username: username.toLowerCase().trim() }] : [])
      ]
    }),
    'Failed to check existing user'
  );

  if (existingUser) {
    throw new ApiError(409, existingUser.email === email ? 'Email already in use' : 'Username already in use', 'DUPLICATE_ERROR');
  }

  // Hash password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create user
  const newUser = await withDb(
    () => User.create({
      name: name.trim(),
      ...(username ? { username: username.toLowerCase().trim() } : {}),
      ...(email ? { email: email.toLowerCase().trim() } : {}),
      password: hashedPassword,
      role: userCount === 0 ? 'ADMIN' : (role || 'VIEWER'),
      status: status || 'ACTIVE',
    }),
    'Failed to create user'
  );

  const userResponse = {
    id: newUser._id,
    name: newUser.name,
    username: newUser.username,
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
