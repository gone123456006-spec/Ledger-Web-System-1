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
const syncRoutes = require('./routes/syncRoutes');

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

// Rate limiting (skip GET /api/v1/health so uptime monitors do not consume quota)
const API_VERSION = '/api/v1';
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  skip(req) {
    if (req.method !== 'GET') return false;
    const path = (req.originalUrl || '').split('?')[0];
    return path === `${API_VERSION}/health`;
  },
});
app.use('/api/', limiter);

// Prevent http param pollution
app.use(hpp());

// Enable CORS — in development, allow any localhost / 127.0.0.1 origin (live-server uses random ports).
const corsOriginEnv = process.env.CORS_ORIGIN || 'http://localhost:8000';
const corsAllowList = corsOriginEnv.split(',').map((s) => s.trim()).filter(Boolean);
const isDev = process.env.NODE_ENV !== 'production';

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (corsAllowList.includes(origin)) return callback(null, true);
      if (
        isDev &&
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  })
);

// Frontend is deployed separately (static site). Keep API-only backend.

// API Routes
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
app.use(`${API_VERSION}/sync`, syncRoutes);

// Health check (no DB; excluded from rate limit via skip above)
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

