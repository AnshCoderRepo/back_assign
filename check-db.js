const mongoose = require('mongoose');

async function checkDatabase() {
  try {
    await mongoose.connect('mongodb+srv://Saanvi:Saanvi@cluster0.9xu4rid.mongodb.net/');
    console.log('Connected to database');

    const db = mongoose.connection.db;
    const userCount = await db.collection('users').countDocuments();
    console.log('User count:', userCount);

    if (userCount > 0) {
      const users = await db.collection('users').find({}, { projection: { password: 0 } }).toArray();
      console.log('Existing users:');
      users.forEach(user => {
        console.log(`- ${user.name}: ${user.email || user.username} (${user.role})`);
      });
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Database error:', error.message);
  }
}

checkDatabase();