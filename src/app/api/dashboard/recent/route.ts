export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth, withApiHandler, apiResponse } from '@/lib/api-utils';
import { RecordService } from '@/lib/services';

export const GET = withApiHandler(async (request: NextRequest) => {
  const user = auth.requireRoles(request, ['ADMIN', 'ANALYST', 'VIEWER']);

  const recentRecords = await RecordService.getRecentRecords(user, 5);

  return apiResponse.success({ recentRecords }, 'Recent records retrieved successfully');
});
