/**
 * Creates the single admin login stored in MongoDB (not in frontend).
 * Run: node seeders/defaultUser.js   (from BackEnd folder)
 *
 * Login field can be the short id "u9xQ7mL2vT8kR4pZ" — frontend maps it to
 * DEFAULT_LOGIN_EMAIL (valid for User schema).
 */
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');

const DEFAULT_LOGIN_EMAIL =
  process.env.DEFAULT_LOGIN_EMAIL || 'u9xQ7mL2vT8kR4pZ@ledger.co';
const DEFAULT_LOGIN_PASSWORD =
  process.env.DEFAULT_LOGIN_PASSWORD || '7#Kx!2vP9@LmQ4$Tz8&Yf3';

async function seedDefaultUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected for default-user seed');

    const existing = await User.findOne({ email: DEFAULT_LOGIN_EMAIL });
    if (existing) {
      console.log('Default user already exists:', DEFAULT_LOGIN_EMAIL);
      await mongoose.connection.close();
      return;
    }

    await User.create({
      name: 'Ledger Admin',
      email: DEFAULT_LOGIN_EMAIL,
      password: DEFAULT_LOGIN_PASSWORD,
      role: 'admin',
      phone: '9999999999',
      isActive: true,
    });

    console.log('Default user created.');
    console.log('  Email (or use short id on login page):', DEFAULT_LOGIN_EMAIL);
    console.log('  Short id for login field: u9xQ7mL2vT8kR4pZ');
    console.log('  Password: (set in .env as DEFAULT_LOGIN_PASSWORD or use project default)');
    await mongoose.connection.close();
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  }
}

seedDefaultUser();
