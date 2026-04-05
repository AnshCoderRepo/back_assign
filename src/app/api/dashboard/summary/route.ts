export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth, withApiHandler, apiResponse } from '@/lib/api-utils';
import { RecordService } from '@/lib/services';

export const GET = withApiHandler(async (request: NextRequest) => {
  const user = auth.requireRoles(request, ['ADMIN', 'ANALYST', 'VIEWER']);

  const summary = await RecordService.getDashboardSummary(user);

  return apiResponse.success({ summary }, 'Dashboard summary retrieved successfully');
});
