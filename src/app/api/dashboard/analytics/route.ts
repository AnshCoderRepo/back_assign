export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth, withApiHandler, apiResponse } from '@/lib/api-utils';
import { RecordService } from '@/lib/services';

export const GET = withApiHandler(async (request: NextRequest) => {
  const user = auth.requireRoles(request, ['ADMIN', 'ANALYST', 'VIEWER']);

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'month'; // 'week', 'month', 'quarter', 'year'
  const category = searchParams.get('category') || undefined;
  const type = searchParams.get('type') as 'INCOME' | 'EXPENSE' | undefined;

  const analytics = await RecordService.getDetailedAnalytics(user, {
    period,
    category,
    type
  });

  return apiResponse.success({ analytics }, 'Detailed analytics retrieved successfully');
});