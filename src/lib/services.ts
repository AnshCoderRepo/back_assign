import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import Record from '@/models/Record';
import bcrypt from 'bcrypt';
import { withDb, ApiError } from '@/lib/api-utils';

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role?: 'ADMIN' | 'ANALYST' | 'VIEWER';
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: 'ADMIN' | 'ANALYST' | 'VIEWER';
  status?: 'ACTIVE' | 'INACTIVE';
  password?: string;
}

export class UserService {
  static async getAllUsers() {
    await connectToDatabase();
    return withDb(
      () => User.find().select('-password').sort({ createdAt: -1 }),
      'Failed to fetch users'
    );
  }

  static async getUserById(id: string) {
    await connectToDatabase();
    const user = await withDb(
      () => User.findById(id).select('-password'),
      'Failed to fetch user'
    );

    if (!user) {
      const error = new Error('User not found');
      (error as any).statusCode = 404;
      throw error;
    }

    return user;
  }

  static async createUser(userData: CreateUserData, isFirstUser = false) {
    await connectToDatabase();

    // Check for existing email
    const existingUser = await withDb(
      () => User.findOne({ email: userData.email }),
      'Failed to check existing user'
    );

    if (existingUser) {
      throw new ApiError(409, 'Email already in use', 'DUPLICATE_ERROR');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    // Create user
    const user = await withDb(
      () => User.create({
        name: userData.name.trim(),
        email: userData.email.toLowerCase().trim(),
        password: hashedPassword,
        role: isFirstUser ? 'ADMIN' : (userData.role || 'VIEWER'),
        status: userData.status || 'ACTIVE',
      }),
      'Failed to create user'
    );

    // Return user without password
    const { password, ...userResponse } = user.toObject();
    return userResponse;
  }

  static async updateUser(id: string, updateData: UpdateUserData) {
    await connectToDatabase();

    // Check if user exists
    const existingUser = await withDb(
      () => User.findById(id),
      'Failed to find user'
    );

    if (!existingUser) {
      throw new ApiError(404, 'User not found', 'NOT_FOUND');
    }

    // Check email uniqueness if email is being changed
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await withDb(
        () => User.findOne({ email: updateData.email, _id: { $ne: id } }),
        'Failed to check email uniqueness'
      );

      if (emailExists) {
        throw new ApiError(409, 'Email already in use', 'DUPLICATE_ERROR');
      }
    }

    // Prepare update data
    const dataToUpdate: any = {};
    if (updateData.name) dataToUpdate.name = updateData.name.trim();
    if (updateData.email) dataToUpdate.email = updateData.email.toLowerCase().trim();
    if (updateData.role) dataToUpdate.role = updateData.role;
    if (updateData.status) dataToUpdate.status = updateData.status;

    // Handle password update
    if (updateData.password) {
      const saltRounds = 10;
      dataToUpdate.password = await bcrypt.hash(updateData.password, saltRounds);
    }

    const updatedUser = await withDb(
      () => User.findByIdAndUpdate(id, dataToUpdate, { new: true }).select('-password'),
      'Failed to update user'
    );

    return updatedUser;
  }

  static async deleteUser(id: string, requestingUserId: string) {
    await connectToDatabase();

    // Check if user exists
    const user = await withDb(
      () => User.findById(id),
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
    if (requestingUserId === id) {
      const error = new Error('Cannot delete your own account');
      (error as any).statusCode = 400;
      throw error;
    }

    await withDb(
      () => User.findByIdAndDelete(id),
      'Failed to delete user'
    );

    return true;
  }

  static async getUserCount() {
    await connectToDatabase();
    return withDb(
      () => User.countDocuments(),
      'Failed to count users'
    );
  }

  static async authenticateUser(email: string, password: string) {
    await connectToDatabase();

    const user = await withDb(
      () => User.findOne({ email: email.toLowerCase() }),
      'Failed to find user'
    );

    if (!user) {
      throw new ApiError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      throw new ApiError(403, 'Account is inactive', 'USER_INACTIVE');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password!);
    if (!isValidPassword) {
      throw new ApiError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    // Return user without password
    const { password: _, ...userResponse } = user.toObject();
    return userResponse;
  }
}

export interface CreateRecordData {
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  date?: string;
  description?: string;
}

export interface RecordFilters {
  type?: 'INCOME' | 'EXPENSE';
  category?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class RecordService {
  static async createRecord(recordData: CreateRecordData, createdBy: string) {
    await connectToDatabase();

    const record = await withDb(
      () => Record.create({
        amount: recordData.amount,
        type: recordData.type,
        category: recordData.category.trim(),
        date: recordData.date ? new Date(recordData.date) : new Date(),
        description: recordData.description?.trim(),
        createdBy,
      }),
      'Failed to create record'
    );

    return record;
  }

  static async getRecords(filters: RecordFilters = {}) {
    await connectToDatabase();

    const {
      type,
      category,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 10
    } = filters;

    const query: any = { isDeleted: { $ne: true } };

    if (type) query.type = type;
    if (category) query.category = category;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (search) {
      query.description = { $regex: search, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      withDb(
        () => Record.find(query)
          .sort({ date: -1 })
          .skip(skip)
          .limit(limit)
          .populate('createdBy', 'name email'),
        'Failed to fetch records'
      ),
      withDb(
        () => Record.countDocuments(query),
        'Failed to count records'
      )
    ]);

    return {
      records,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async getDashboardSummary(user: { id: string; role: string }) {
    await connectToDatabase();

    const matchQuery: any = { isDeleted: { $ne: true } };


    const summary = await withDb(
      () => Record.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' }
          }
        }
      ]),
      'Failed to fetch summary'
    );

    let totalIncome = 0;
    let totalExpense = 0;

    summary.forEach((item: any) => {
      if (item._id === 'INCOME') totalIncome = item.total;
      if (item._id === 'EXPENSE') totalExpense = item.total;
    });

    // 2. Category wise totals
    const categoryTotals = await withDb(
      () => Record.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: { type: '$type', category: '$category' },
            total: { $sum: '$amount' }
          }
        },
        { $sort: { total: -1 } }
      ]),
      'Failed to fetch category totals'
    );

    const categories = categoryTotals.map((item: any) => ({
      type: item._id.type,
      category: item._id.category,
      total: item.total
    }));

    // 3. Monthly trends 
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);

    const trendsQuery = { ...matchQuery, date: { $gte: sixMonthsAgo } };
    
    const monthlyTrends = await withDb(
      () => Record.aggregate([
        { $match: trendsQuery },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' },
              type: '$type'
            },
            total: { $sum: '$amount' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      'Failed to fetch trends'
    );

    const formattedTrends = monthlyTrends.map((item: any) => ({
      year: item._id.year,
      month: item._id.month,
      type: item._id.type,
      total: item.total
    }));

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      categoryTotals: categories,
      monthlyTrends: formattedTrends
    };
  }

  static async getCategoryAnalytics(user: { id: string; role: string }, type?: 'INCOME' | 'EXPENSE') {
    await connectToDatabase();

    const matchQuery: any = { isDeleted: { $ne: true } };
    if (type) {
      matchQuery.type = type;
    }

    // Get detailed category breakdown with transaction counts
    const categoryDetails = await withDb(
      () => Record.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: { type: '$type', category: '$category' },
            totalAmount: { $sum: '$amount' },
            transactionCount: { $sum: 1 },
            minAmount: { $min: '$amount' },
            maxAmount: { $max: '$amount' },
            avgAmount: { $avg: '$amount' },
            firstTransaction: { $min: '$date' },
            lastTransaction: { $max: '$date' }
          }
        },
        {
          $group: {
            _id: '$_id.type',
            categories: {
              $push: {
                category: '$_id.category',
                totalAmount: '$totalAmount',
                transactionCount: '$transactionCount',
                minAmount: '$minAmount',
                maxAmount: '$maxAmount',
                avgAmount: '$avgAmount',
                firstTransaction: '$firstTransaction',
                lastTransaction: '$lastTransaction'
              }
            },
            totalTypeAmount: { $sum: '$totalAmount' },
            totalTypeTransactions: { $sum: '$transactionCount' }
          }
        },
        { $sort: { '_id': 1 } }
      ]),
      'Failed to fetch category analytics'
    );

    // Get recent transactions for each category (last 5 per category)
    const recentTransactionsByCategory = await withDb(
      () => Record.find(matchQuery)
        .sort({ date: -1 })
        .limit(50) // Get more to distribute across categories
        .populate('createdBy', 'name'),
      'Failed to fetch recent transactions'
    );

    // Group recent transactions by category
    const categoryRecentTransactions: any = {};
    recentTransactionsByCategory.forEach(record => {
      const key = `${record.type}_${record.category}`;
      if (!categoryRecentTransactions[key]) {
        categoryRecentTransactions[key] = [];
      }
      if (categoryRecentTransactions[key].length < 3) { // Limit to 3 recent per category
        categoryRecentTransactions[key].push({
          id: record._id,
          amount: record.amount,
          date: record.date,
          description: record.description,
          createdBy: record.createdBy?.name || 'Unknown'
        });
      }
    });

    // Enhance category details with recent transactions
    const enhancedCategories = categoryDetails.map((typeGroup: any) => ({
      ...typeGroup,
      categories: typeGroup.categories.map((cat: any) => ({
        ...cat,
        recentTransactions: categoryRecentTransactions[`${typeGroup._id}_${cat.category}`] || []
      }))
    }));

    return {
      summary: enhancedCategories,
      totalCategories: enhancedCategories.reduce((sum: number, type: any) => sum + type.categories.length, 0),
      totalTransactions: enhancedCategories.reduce((sum: number, type: any) => sum + type.totalTypeTransactions, 0),
      totalAmount: enhancedCategories.reduce((sum: number, type: any) => sum + type.totalTypeAmount, 0)
    };
  }

  static async getDetailedAnalytics(user: { id: string; role: string }, filters: {
    period: string;
    category?: string;
    type?: 'INCOME' | 'EXPENSE';
  }) {
    await connectToDatabase();

    const { period, category, type } = filters;
    const matchQuery: any = { isDeleted: { $ne: true } };

    if (type) matchQuery.type = type;
    if (category) matchQuery.category = category;

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStart, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    matchQuery.date = { $gte: startDate };

    // 1. Daily transaction trends (for line charts)
    const dailyTrends = await withDb(
      () => Record.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: {
              date: {
                $dateToString: { format: '%Y-%m-%d', date: '$date' }
              },
              type: '$type'
            },
            totalAmount: { $sum: '$amount' },
            transactionCount: { $sum: 1 }
          }
        },
        { $sort: { '_id.date': 1, '_id.type': 1 } }
      ]),
      'Failed to fetch daily trends'
    );

    // 2. Category distribution (for pie/donut charts)
    const categoryDistribution = await withDb(
      () => Record.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: { type: '$type', category: '$category' },
            totalAmount: { $sum: '$amount' },
            transactionCount: { $sum: 1 }
          }
        },
        { $sort: { totalAmount: -1 } }
      ]),
      'Failed to fetch category distribution'
    );

    // 3. Hourly patterns (for heatmaps)
    const hourlyPatterns = await withDb(
      () => Record.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: {
              hour: { $hour: '$date' },
              type: '$type'
            },
            totalAmount: { $sum: '$amount' },
            transactionCount: { $sum: 1 }
          }
        },
        { $sort: { '_id.hour': 1, '_id.type': 1 } }
      ]),
      'Failed to fetch hourly patterns'
    );

    // 4. Amount ranges distribution (for histograms)
    const amountRanges = await withDb(
      () => Record.aggregate([
        { $match: matchQuery },
        {
          $bucket: {
            groupBy: '$amount',
            boundaries: [0, 50, 100, 500, 1000, 5000, 10000, 50000, 100000],
            default: '100000+',
            output: {
              count: { $sum: 1 },
              totalAmount: { $sum: '$amount' },
              types: { $addToSet: '$type' }
            }
          }
        }
      ]),
      'Failed to fetch amount ranges'
    );

    // 5. Top spending categories with trends
    const topCategories = await withDb(
      () => Record.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: { type: '$type', category: '$category' },
            totalAmount: { $sum: '$amount' },
            transactionCount: { $sum: 1 },
            avgAmount: { $avg: '$amount' }
          }
        },
        { $sort: { totalAmount: -1 } },
        { $limit: 10 }
      ]),
      'Failed to fetch top categories'
    );

    // 6. Monthly comparison (current vs previous period)
    const previousPeriodStart = new Date(startDate);
    if (period === 'month') {
      previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 1);
    } else if (period === 'quarter') {
      previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 3);
    } else if (period === 'year') {
      previousPeriodStart.setFullYear(previousPeriodStart.getFullYear() - 1);
    }

    const currentPeriodData = await withDb(
      () => Record.aggregate([
        { $match: { ...matchQuery, date: { $gte: startDate } } },
        {
          $group: {
            _id: '$type',
            totalAmount: { $sum: '$amount' },
            transactionCount: { $sum: 1 }
          }
        }
      ]),
      'Failed to fetch current period data'
    );

    const previousPeriodData = await withDb(
      () => Record.aggregate([
        {
          $match: {
            ...matchQuery,
            date: { $gte: previousPeriodStart, $lt: startDate }
          }
        },
        {
          $group: {
            _id: '$type',
            totalAmount: { $sum: '$amount' },
            transactionCount: { $sum: 1 }
          }
        }
      ]),
      'Failed to fetch previous period data'
    );

    // Format data for charts
    const chartData = {
      dailyTrends: dailyTrends.map(item => ({
        date: item._id.date,
        type: item._id.type,
        amount: item.totalAmount,
        count: item.transactionCount
      })),

      categoryDistribution: categoryDistribution.map(item => ({
        type: item._id.type,
        category: item._id.category,
        amount: item.totalAmount,
        count: item.transactionCount,
        percentage: 0 // Will be calculated below
      })),

      hourlyPatterns: hourlyPatterns.map(item => ({
        hour: item._id.hour,
        type: item._id.type,
        amount: item.totalAmount,
        count: item.transactionCount
      })),

      amountRanges: amountRanges.map(item => ({
        range: item._id,
        count: item.count,
        amount: item.totalAmount,
        types: item.types
      })),

      topCategories: topCategories.map(item => ({
        type: item._id.type,
        category: item._id.category,
        amount: item.totalAmount,
        count: item.transactionCount,
        avgAmount: Math.round(item.avgAmount * 100) / 100
      })),

      periodComparison: {
        current: currentPeriodData.reduce((acc: any, item: any) => {
          acc[item._id] = { amount: item.totalAmount, count: item.transactionCount };
          return acc;
        }, {}),
        previous: previousPeriodData.reduce((acc: any, item: any) => {
          acc[item._id] = { amount: item.totalAmount, count: item.transactionCount };
          return acc;
        }, {})
      }
    };

    // Calculate percentages for category distribution
    const totalByType: any = {};
    chartData.categoryDistribution.forEach((item: any) => {
      if (!totalByType[item.type]) totalByType[item.type] = 0;
      totalByType[item.type] += item.amount;
    });

    chartData.categoryDistribution.forEach((item: any) => {
      item.percentage = Math.round((item.amount / totalByType[item.type]) * 100 * 100) / 100;
    });

    return {
      period,
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: now.toISOString().split('T')[0]
      },
      filters: { category, type },
      summary: (() => {
        const totalTransactions = chartData.dailyTrends.reduce((sum: number, item: any) => sum + item.count, 0);
        const totalAmount = chartData.categoryDistribution.reduce((sum: number, item: any) => sum + item.amount, 0);
        const avgTransactionAmount = totalTransactions ? Math.round((totalAmount / totalTransactions) * 100) / 100 : 0;

        return {
          totalTransactions,
          totalAmount,
          categoriesCount: new Set(chartData.categoryDistribution.map((item: any) => item.category)).size,
          avgTransactionAmount
        };
      })(),
      charts: chartData
    };
  }

  static async getRecentRecords(user: { id: string; role: string }, limit = 5) {
    await connectToDatabase();

    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const query: any = { isDeleted: { $ne: true } };

    return withDb(
      () => Record.find(query)
        .sort({ date: -1, createdAt: -1 })
        .limit(safeLimit)
        .populate('createdBy', 'name email'),
      'Failed to fetch recent records'
    );
  }
}