const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const colors = require('colors');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

// Connect to database
const connectDB = require('./config/database');
connectDB();

// Route files
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const orderRoutes = require('./routes/orderRoutes');
const itemRoutes = require('./routes/itemRoutes');
const billRoutes = require('./routes/billRoutes');
const jobWorkerRoutes = require('./routes/jobWorkerRoutes');
const agentRoutes = require('./routes/agentRoutes');
const loanRoutes = require('./routes/loanRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const rateBookRoutes = require('./routes/rateBookRoutes');
const stationRoutes = require('./routes/stationRoutes');

// Middleware
const errorHandler = require('./middleware/error');

const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Sanitize data
app.use(mongoSanitize());

// Set security headers
app.use(helmet());

// Prevent XSS attacks
app.use(xss());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Prevent http param pollution
app.use(hpp());

// Enable CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:8000',
    credentials: true,
  })
);

// Set static folder
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
const API_VERSION = '/api/v1';

app.use(`${API_VERSION}/auth`, authRoutes);
app.use(`${API_VERSION}/customers`, customerRoutes);
app.use(`${API_VERSION}/orders`, orderRoutes);
app.use(`${API_VERSION}/items`, itemRoutes);
app.use(`${API_VERSION}/bills`, billRoutes);
app.use(`${API_VERSION}/jobworkers`, jobWorkerRoutes);
app.use(`${API_VERSION}/agents`, agentRoutes);
app.use(`${API_VERSION}/loans`, loanRoutes);
app.use(`${API_VERSION}/payments`, paymentRoutes);
app.use(`${API_VERSION}/transactions`, transactionRoutes);
app.use(`${API_VERSION}/ratebook`, rateBookRoutes);
app.use(`${API_VERSION}/stations`, stationRoutes);

// Health check route
app.get(`${API_VERSION}/health`, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Ledger API Server',
    version: '1.0.0',
    documentation: `${req.protocol}://${req.get('host')}${API_VERSION}`,
  });
});

// Error handler middleware (must be after routes)
app.use(errorHandler);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  // Close server & exit process
  // server.close(() => process.exit(1));
});

const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
  )
);

module.exports = app;

