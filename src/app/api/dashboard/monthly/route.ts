import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Record from '@/models/Record';
import { extractUserFromRequest, checkRole } from '@/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    const authUser = extractUserFromRequest(request);
    if (!checkRole(authUser, ['ADMIN', 'ANALYST', 'VIEWER'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

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

    return NextResponse.json({ year, monthlySummary });
  } catch (error: any) {
    console.error('Fetch monthly summary error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
