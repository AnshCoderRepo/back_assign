import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcrypt';
import { auth, validate, withDb, withApiHandler, apiResponse } from '@/lib/api-utils';

export const GET = withApiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  const authenticatedUser = auth.requireRoles(request, ['ADMIN']);

  await connectToDatabase();

  const user = await withDb(
    () => User.findById(params.id).select('-password'),
    'Failed to fetch user'
  );

  if (!user) {
    const error = new Error('User not found');
    (error as any).statusCode = 404;
    throw error;
  }

  return apiResponse.success(user, 'User retrieved successfully');
});

export const PUT = withApiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  const authenticatedUser = auth.requireRoles(request, ['ADMIN']);

  const { name, email, role, status, password } = await request.json();

  // Validate input
  if (name) validate.required(name, 'Name');
  if (email) {
    validate.email(email);
  }
  if (role) {
    validate.oneOf(role, ['ADMIN', 'ANALYST', 'VIEWER'], 'role');
  }
  if (status) {
    validate.oneOf(status, ['ACTIVE', 'INACTIVE'], 'status');
  }

  await connectToDatabase();

  // Check if user exists
  const existingUser = await withDb(
    () => User.findById(params.id),
    'Failed to find user'
  );

  if (!existingUser) {
    const error = new Error('User not found');
    (error as any).statusCode = 404;
    throw error;
  }

  // Check email uniqueness if email is being changed
  if (email && email !== existingUser.email) {
    const emailExists = await withDb(
      () => User.findOne({ email, _id: { $ne: params.id } }),
      'Failed to check email uniqueness'
    );

    if (emailExists) {
      const error = new Error('Email already in use');
      (error as any).statusCode = 409;
      throw error;
    }
  }

  // Prepare update data
  const updateData: any = {};
  if (name) updateData.name = name.trim();
  if (email) updateData.email = email.toLowerCase().trim();
  if (role) updateData.role = role;
  if (status) updateData.status = status;

  // Handle password update
  if (password) {
    const saltRounds = 10;
    updateData.password = await bcrypt.hash(password, saltRounds);
  }

  const updatedUser = await withDb(
    () => User.findByIdAndUpdate(params.id, updateData, { new: true }).select('-password'),
    'Failed to update user'
  );

  return apiResponse.success(updatedUser, 'User updated successfully');
});

export const DELETE = withApiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  const authenticatedUser = auth.requireRoles(request, ['ADMIN']);

  await connectToDatabase();

  // Check if user exists
  const user = await withDb(
    () => User.findById(params.id),
    'Failed to find user'
  );

  if (!user) {
    const error = new Error('User not found');
    (error as any).statusCode = 404;
    throw error;
  }

  // Prevent deleting the last admin
  if (user.role === 'ADMIN') {
    const adminCount = await withDb(
      () => User.countDocuments({ role: 'ADMIN' }),
      'Failed to count admins'
    );

    if (adminCount <= 1) {
      const error = new Error('Cannot delete the last admin user');
      (error as any).statusCode = 400;
      throw error;
    }
  }

  // Prevent self-deletion
  if (authenticatedUser.id === params.id) {
    const error = new Error('Cannot delete your own account');
    (error as any).statusCode = 400;
    throw error;
  }

  await withDb(
    () => User.findByIdAndDelete(params.id),
    'Failed to delete user'
  );

  return apiResponse.success(null, 'User deleted successfully');
});