const fs = require('fs');
const mongoose = require('mongoose');
const path = require('path');

function loadEnv() {
  const envPath = path.resolve(__dirname, '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const [key, ...rest] = trimmed.split('=');
    envVars[key.trim()] = rest.join('=').trim();
  });
  return envVars;
}

async function seedDemoTransactions() {
  try {
    const env = loadEnv();
    const uri = env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI not defined in .env');
    }

    await mongoose.connect(uri);

    const UserSchema = new mongoose.Schema(
      {
        name: { type: String, required: true },
        username: { type: String, unique: true, sparse: true },
        email: { type: String, unique: true, sparse: true },
        password: { type: String, required: true, select: false },
        role: { type: String, enum: ['ADMIN', 'ANALYST', 'VIEWER'], default: 'VIEWER' },
        status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
      },
      { timestamps: true }
    );

    const RecordSchema = new mongoose.Schema(
      {
        amount: { type: Number, required: true, min: [0.01, 'Amount must be greater than 0'] },
        type: { type: String, required: true, enum: ['INCOME', 'EXPENSE'] },
        category: { type: String, required: true },
        date: { type: Date, required: true, default: Date.now },
        description: { type: String },
        isDeleted: { type: Boolean, default: false },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      },
      { timestamps: true }
    );

    const User = mongoose.models.User || mongoose.model('User', UserSchema);
    const Record = mongoose.models.Record || mongoose.model('Record', RecordSchema);

    let admin = await User.findOne({ email: 'saanviv464@gmail.com' });
    if (!admin) {
      console.log('Admin user not found. Creating fallback admin user...');
      admin = await User.create({
        name: 'Admin User',
        email: 'saanviv464@gmail.com',
        password: 'Admin@123',
        role: 'ADMIN',
        status: 'ACTIVE',
      });
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const categories = ['Salary', 'Groceries', 'Rent', 'Utilities', 'Entertainment', 'Transportation', 'Health', 'Travel', 'Education', 'Freelance'];
    const descriptions = ['Monthly payment', 'Weekly groceries', 'House rent', 'Electricity bill', 'Dinner out', 'Taxi fare', 'Doctor visit', 'Flight booking', 'Online course', 'Project invoice'];

    const records = [];
    for (let i = 0; i < 15; i += 1) {
      const isIncome = i % 4 === 0;
      const category = categories[i % categories.length];
      const amount = isIncome
        ? Math.round((Math.random() * 3500 + 500) * 100) / 100
        : Math.round((Math.random() * 900 + 50) * 100) / 100;
      const date = new Date(currentYear, currentMonth, Math.min(28, 1 + Math.floor(Math.random() * 28)));
      const description = descriptions[i % descriptions.length];

      records.push({
        amount,
        type: isIncome ? 'INCOME' : 'EXPENSE',
        category,
        date,
        description,
        createdBy: admin._id,
      });
    }

    const created = await Record.insertMany(records);
    console.log(`Inserted ${created.length} demo transaction records.`);
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error seeding demo transactions:', error);
    process.exit(1);
  }
}

seedDemoTransactions();