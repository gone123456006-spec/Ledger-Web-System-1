const fs = require('fs');
const mongoose = require('mongoose');
const colors = require('colors');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

// Load models
const User = require('../models/User');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const Item = require('../models/Item');
const JobWorker = require('../models/JobWorker');
const Agent = require('../models/Agent');
const Bill = require('../models/Bill');
const Loan = require('../models/Loan');
const Payment = require('../models/Payment');
const Transaction = require('../models/Transaction');
const RateBook = require('../models/RateBook');
const Station = require('../models/Station');

// Connect to DB
mongoose.connect(process.env.MONGO_URI);

// Sample data
const users = [
  {
    name: 'Admin User',
    email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@ledgersystem.com',
    password: process.env.DEFAULT_ADMIN_PASSWORD || 'admin123',
    role: 'admin',
    phone: '9876543210',
    isActive: true,
  },
  {
    name: 'Manager User',
    email: 'manager@ledgersystem.com',
    password: 'manager123',
    role: 'manager',
    phone: '9876543211',
    isActive: true,
  },
  {
    name: 'Staff User',
    email: 'staff@ledgersystem.com',
    password: 'staff123',
    role: 'staff',
    phone: '9876543212',
    isActive: true,
  },
];

const stations = [
  {
    name: 'Main Branch',
    code: 'MB',
    description: 'Main Branch Office',
    address: {
      street: '123 Main Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      country: 'India',
    },
    phone: '0221234567',
    email: 'mainbranch@ledgersystem.com',
  },
  {
    name: 'Branch 2',
    code: 'B2',
    description: 'Second Branch',
    address: {
      street: '456 Market Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400002',
      country: 'India',
    },
    phone: '0221234568',
    email: 'branch2@ledgersystem.com',
  },
];

const rateBooks = [
  {
    date: new Date(),
    rates: [
      {
        metal: 'gold',
        purity: '24K',
        buyingRate: 6200,
        sellingRate: 6250,
        unit: 'gm',
      },
      {
        metal: 'gold',
        purity: '22K',
        buyingRate: 5700,
        sellingRate: 5750,
        unit: 'gm',
      },
      {
        metal: 'gold',
        purity: '18K',
        buyingRate: 4650,
        sellingRate: 4700,
        unit: 'gm',
      },
      {
        metal: 'silver',
        purity: '999',
        buyingRate: 75,
        sellingRate: 78,
        unit: 'gm',
      },
      {
        metal: 'silver',
        purity: '925',
        buyingRate: 70,
        sellingRate: 73,
        unit: 'gm',
      },
    ],
    defaultMakingCharges: {
      gold: { percentage: 15, perGram: 0 },
      silver: { percentage: 10, perGram: 0 },
      platinum: { percentage: 12, perGram: 0 },
    },
    gstRates: {
      gold: 3,
      silver: 3,
      platinum: 3,
      makingCharges: 5,
    },
    isActive: true,
  },
];

// Import into DB
const importData = async () => {
  try {
    await User.create(users);
    await Station.create(stations);
    await RateBook.create(rateBooks);

    console.log('Data Imported...'.green.inverse);
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

// Delete data
const deleteData = async () => {
  try {
    await User.deleteMany();
    await Customer.deleteMany();
    await Order.deleteMany();
    await Item.deleteMany();
    await JobWorker.deleteMany();
    await Agent.deleteMany();
    await Bill.deleteMany();
    await Loan.deleteMany();
    await Payment.deleteMany();
    await Transaction.deleteMany();
    await RateBook.deleteMany();
    await Station.deleteMany();

    console.log('Data Destroyed...'.red.inverse);
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

if (process.argv[2] === '-i') {
  importData();
} else if (process.argv[2] === '-d') {
  deleteData();
} else {
  console.log('Please provide -i to import or -d to delete data'.yellow);
  process.exit();
}

