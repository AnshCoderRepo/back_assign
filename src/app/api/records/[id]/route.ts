import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Record from '@/models/Record';
import { auth, validate, withApiHandler, apiResponse, ApiError } from '@/lib/api-utils';

export const PUT = withApiHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const user = auth.requireRoles(request, ['ADMIN']);
  const { id } = await params;
  
  // Validate ID
  validate.objectId(id, 'Record ID');

  const data = await request.json();

  // Validate incoming fields
  if (data.amount !== undefined) {
    validate.positiveNumber(data.amount, 'amount');
  }

  if (data.type !== undefined) {
    validate.oneOf(data.type, ['INCOME', 'EXPENSE'], 'type');
  }

  if (data.category !== undefined) {
    validate.required(data.category, 'category');
  }

  await connectToDatabase();

  const record = await Record.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true }
  );

  if (!record) {
    throw new ApiError(404, 'Record not found');
  }

  return apiResponse.success(record, 'Record updated successfully');
});

export const DELETE = withApiHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const user = auth.requireRoles(request, ['ADMIN']);
  const { id } = await params;

  // Validate ID
  validate.objectId(id, 'Record ID');

  await connectToDatabase();

  const record = await Record.findByIdAndUpdate(id, { $set: { isDeleted: true } }, { new: true });

  if (!record) {
    throw new ApiError(404, 'Record not found');
  }

  return apiResponse.success(null, 'Record deleted successfully');
});
