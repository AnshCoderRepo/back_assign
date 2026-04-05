import { NextRequest, NextResponse } from 'next/server';
import { auth, validate, withApiHandler, apiResponse } from '@/lib/api-utils';
import { RecordService } from '@/lib/services';

export const POST = withApiHandler(async (request: NextRequest) => {
  const user = auth.requireRoles(request, ['ADMIN']);

  const { amount, type, category, date, description } = await request.json();

  // Validate input
  validate.positiveNumber(amount, 'amount');
  validate.required(type, 'type');
  validate.oneOf(type, ['INCOME', 'EXPENSE'], 'type');
  validate.required(category, 'category');

  const record = await RecordService.createRecord({
    amount,
    type,
    category,
    date,
    description
  }, user.id);

  return apiResponse.success(record, 'Record created successfully');
});

export const GET = withApiHandler(async (request: NextRequest) => {
  const user = auth.requireRoles(request, ['ADMIN', 'ANALYST', 'VIEWER']);

  const { searchParams } = new URL(request.url);
  const filters = {
    type: searchParams.get('type') as 'INCOME' | 'EXPENSE' | undefined,
    category: searchParams.get('category') || undefined,
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
    search: searchParams.get('search') || undefined,
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '10')
  };

  // Validate pagination
  if (filters.page < 1) filters.page = 1;
  if (filters.limit < 1 || filters.limit > 100) filters.limit = 10;

  const result = await RecordService.getRecords(filters);

  return apiResponse.success(result, 'Records retrieved successfully');
});
