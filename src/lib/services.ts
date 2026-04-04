import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import Record from '@/models/Record';
import bcrypt from 'bcrypt';
import { withDb } from '@/lib/api-utils';

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
      const error = new Error('Email already in use');
      (error as any).statusCode = 409;
      throw error;
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
      const error = new Error('User not found');
      (error as any).statusCode = 404;
      throw error;
    }

    // Check email uniqueness if email is being changed
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await withDb(
        () => User.findOne({ email: updateData.email, _id: { $ne: id } }),
        'Failed to check email uniqueness'
      );

      if (emailExists) {
        const error = new Error('Email already in use');
        (error as any).statusCode = 409;
        throw error;
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
      const error = new Error('Invalid credentials');
      (error as any).statusCode = 401;
      throw error;
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      const error = new Error('Account is inactive');
      (error as any).statusCode = 403;
      throw error;
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      const error = new Error('Invalid credentials');
      (error as any).statusCode = 401;
      throw error;
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

    const query: any = {};

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

  static async getDashboardSummary() {
    await connectToDatabase();

    const summary = await withDb(
      () => Record.aggregate([
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

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense
    };
  }

  static async getRecentRecords(limit = 5) {
    await connectToDatabase();

    return withDb(
      () => Record.find()
        .sort({ date: -1, createdAt: -1 })
        .limit(limit)
        .populate('createdBy', 'name email'),
      'Failed to fetch recent records'
    );
  }
}