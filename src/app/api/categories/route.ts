export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth, withApiHandler, apiResponse } from '@/lib/api-utils';
import { RecordService } from '@/lib/services';

export const GET = withApiHandler(async (request: NextRequest) => {
  const user = auth.requireRoles(request, ['ADMIN', 'ANALYST']);

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') as 'INCOME' | 'EXPENSE' | undefined;

  const categories = await RecordService.getCategories(user, type);

  return apiResponse.success({ categories }, 'Categories retrieved successfully');
});