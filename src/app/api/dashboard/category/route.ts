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
    const type = searchParams.get('type');

    await connectToDatabase();

    const matchStage: any = {};
    if (type && ['INCOME', 'EXPENSE'].includes(type)) {
      matchStage.type = type;
    }

    const categorySummary = await Record.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { type: '$type', category: '$category' },
          total: { $sum: '$amount' }
        }
      },
      {
        $group: {
          _id: '$_id.type',
          categories: {
            $push: {
              category: '$_id.category',
              total: '$total'
            }
          }
        }
      }
    ]);

    return NextResponse.json({ categorySummary });
  } catch (error: any) {
    console.error('Fetch dashboard category summary error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
