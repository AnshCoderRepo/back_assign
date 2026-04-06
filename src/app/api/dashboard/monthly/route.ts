import { NextRequest } from 'next/server';
import { auth, withApiHandler, apiResponse } from '@/lib/api-utils';
import { connectToDatabase } from '@/lib/db';
import Record from '@/models/Record';

export const dynamic = 'force-dynamic';

export const GET = withApiHandler(async (request: NextRequest) => {
  const user = auth.requireRoles(request, ['ADMIN', 'ANALYST', 'VIEWER']);
  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get('year')) || new Date().getFullYear();

  await connectToDatabase();

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const monthlySummary = await Record.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: '$date' },
            type: '$type'
          },
          total: { $sum: '$amount' }
        }
      },
      {
        $group: {
          _id: '$_id.month',
          data: {
            $push: {
              type: '$_id.type',
              total: '$total'
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return apiResponse.success({ year, monthlySummary }, 'Monthly summary retrieved successfully');
});
