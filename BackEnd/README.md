# Ledger Management System - Backend API

A comprehensive Node.js/Express/MongoDB backend API for a jewellery ledger management system with features for customer management, orders, billing, inventory, and accounting.

## 🚀 Features

### Core Modules
- **Authentication & Authorization** - JWT-based auth with role-based access control
- **Customer Management** - Complete customer CRUD with balance tracking
- **Order Management** - Order processing, status tracking, and assignment
- **Inventory Management** - Item management with stock tracking
- **Billing System** - Invoice generation with GST calculations
- **Job Worker Management** - Track external workers and their assignments
- **Agent Management** - Commission-based agent tracking
- **Loan Management** - Cash and metal loan tracking
- **Payment Processing** - Multiple payment methods support
- **Transaction Ledger** - Complete day book and financial tracking
- **Rate Book** - Daily rate management for precious metals
- **Station Management** - Multi-branch support

### Technical Features
- RESTful API architecture
- MongoDB with Mongoose ODM
- JWT authentication
- Role-based access control (RBAC)
- Advanced filtering, sorting, and pagination
- Input validation and sanitization
- Security best practices (Helmet, XSS protection, Rate limiting)
- Comprehensive error handling
- Request logging
- PDF generation for invoices
- GST calculations

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## 🔧 Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
Create a `.env` file in the backend directory:
```bash
cp env.example .env
```

Edit `.env` with your configuration:
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/ledger_system
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30
CORS_ORIGIN=http://localhost:8000
```

4. **Start MongoDB**
```bash
# If using local MongoDB
mongod
```

5. **Seed the database (optional)**
```bash
npm run seed
```

6. **Start the server**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:5000`

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication Endpoints

#### Register User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "staff",
  "phone": "9876543210"
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/v1/auth/me
Authorization: Bearer <token>
```

### Customer Endpoints

#### Get All Customers
```http
GET /api/v1/customers?page=1&limit=20&search=john
Authorization: Bearer <token>
```

#### Get Single Customer
```http
GET /api/v1/customers/:id
Authorization: Bearer <token>
```

#### Create Customer
```http
POST /api/v1/customers
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "phone": "9876543210",
  "mobile": "9876543211",
  "email": "john@example.com",
  "address": "123 Main St",
  "station": "Main Branch",
  "relation": "S/O",
  "relationName": "Father Name",
  "openingBalance": 0,
  "goldBalance": { "weight": 0, "unit": "gm" },
  "silverBalance": { "weight": 0, "unit": "gm" },
  "maxCreditLimit": 100000
}
```

#### Update Customer
```http
PUT /api/v1/customers/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "phone": "9876543210"
}
```

#### Get Customer Balance
```http
GET /api/v1/customers/:id/balance
Authorization: Bearer <token>
```

#### Search Customers
```http
GET /api/v1/customers/search?query=john
Authorization: Bearer <token>
```

### Order Endpoints

#### Get All Orders
```http
GET /api/v1/orders?status=pending&page=1&limit=20
Authorization: Bearer <token>
```

#### Create Order
```http
POST /api/v1/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "customer": "customer_id",
  "billNumber": "BILL-001",
  "orderDate": "2024-01-15",
  "items": [
    {
      "itemName": "Gold Ring",
      "quantity": 1,
      "metal": "gold",
      "purity": "22K",
      "estimatedWeight": { "value": 5, "unit": "gm" },
      "rate": 5750,
      "makingCharges": { "value": 15, "type": "percentage" },
      "subtotal": 33062.5,
      "gstAmount": 991.88,
      "total": 34054.38
    }
  ],
  "subtotal": 33062.5,
  "gstRate": 3,
  "gstAmount": 991.88,
  "totalAmount": 34054.38,
  "advancePaid": 10000
}
```

#### Update Order Status
```http
PUT /api/v1/orders/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "ready"
}
```

#### Get Pending Orders
```http
GET /api/v1/orders/pending
Authorization: Bearer <token>
```

### Bill Endpoints

#### Create Bill
```http
POST /api/v1/bills
Authorization: Bearer <token>
Content-Type: application/json

{
  "customer": "customer_id",
  "billType": "sale",
  "billDate": "2024-01-15",
  "items": [...],
  "subtotal": 50000,
  "totalGst": 1500,
  "totalAmount": 51500
}
```

#### Record Payment for Bill
```http
POST /api/v1/bills/:id/payment
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 10000,
  "paymentMethod": "cash"
}
```

#### Get Unpaid Bills
```http
GET /api/v1/bills/unpaid
Authorization: Bearer <token>
```

### Transaction Endpoints (Day Book)

#### Get Day Book
```http
GET /api/v1/transactions/daybook/2024-01-15
Authorization: Bearer <token>
```

#### Get Transactions by Date Range
```http
GET /api/v1/transactions/daterange?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>
```

#### Get Transactions by Financial Year
```http
GET /api/v1/transactions/financialyear/2023-2024
Authorization: Bearer <token>
```

### Rate Book Endpoints

#### Get Latest Rates
```http
GET /api/v1/ratebook/latest
Authorization: Bearer <token>
```

#### Get Specific Rate
```http
GET /api/v1/ratebook/rate/gold/22K?type=sellingRate
Authorization: Bearer <token>
```

#### Create Rate Book
```http
POST /api/v1/ratebook
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2024-01-15",
  "rates": [
    {
      "metal": "gold",
      "purity": "22K",
      "buyingRate": 5700,
      "sellingRate": 5750,
      "unit": "gm"
    }
  ]
}
```

## 🔐 Authentication

All protected routes require a JWT token in the Authorization header:

```http
Authorization: Bearer <your_jwt_token>
```

Or as a cookie named `token`.

## 👥 User Roles

- **admin** - Full access to all features
- **manager** - Access to most features except critical deletions
- **staff** - Limited access for day-to-day operations
- **accountant** - Access to financial records and reports

## 🛡️ Security Features

- JWT authentication
- Password hashing with bcrypt
- XSS protection
- Rate limiting
- HTTP parameter pollution prevention
- MongoDB injection prevention
- Security headers with Helmet
- CORS protection
- Input validation and sanitization

## 📊 Database Schema

### Main Collections
- **users** - System users with authentication
- **customers** - Customer information and balances
- **orders** - Order details and items
- **items** - Inventory items catalog
- **bills** - Invoices and billing
- **jobworkers** - External workers
- **agents** - Sales agents
- **loans** - Loan tracking
- **payments** - Payment records
- **transactions** - All financial transactions
- **ratebooks** - Daily precious metal rates
- **stations** - Branch locations

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 📦 Project Structure

```
backend/
├── config/
│   ├── database.js
│   └── constants.js
├── controllers/
│   ├── authController.js
│   ├── customerController.js
│   ├── orderController.js
│   └── ...
├── middleware/
│   ├── auth.js
│   ├── error.js
│   ├── async.js
│   └── advancedResults.js
├── models/
│   ├── User.js
│   ├── Customer.js
│   ├── Order.js
│   └── ...
├── routes/
│   ├── authRoutes.js
│   ├── customerRoutes.js
│   ├── orderRoutes.js
│   └── ...
├── utils/
│   ├── errorResponse.js
│   ├── calculateGST.js
│   └── ...
├── seeders/
│   └── seeder.js
├── server.js
├── package.json
└── README.md
```

## 🚀 Deployment

### Environment Variables
Ensure all environment variables are properly set for production:
- Set `NODE_ENV=production`
- Use strong `JWT_SECRET`
- Set appropriate `CORS_ORIGIN`
- Configure production database URL

### Docker (Optional)
```dockerfile
FROM node:14
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 📝 API Response Format

### Success Response
```json
{
  "success": true,
  "count": 10,
  "pagination": {
    "next": { "page": 2, "limit": 20 },
    "prev": { "page": 1, "limit": 20 }
  },
  "data": [...]
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message here"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 💡 Support

For support, email support@ledgersystem.com or create an issue in the repository.

## 🔄 Version History

- **1.0.0** (2024-01-15)
  - Initial release
  - Complete CRUD operations for all modules
  - Authentication and authorization
  - Advanced filtering and pagination
  - GST calculations
  - Transaction tracking

## 🎯 Future Enhancements

- [ ] SMS notifications
- [ ] Email notifications
- [ ] Export to Excel/PDF
- [ ] Advanced reporting dashboard
- [ ] Barcode/QR code generation
- [ ] Multi-currency support
- [ ] Automated backups
- [ ] WhatsApp integration
- [ ] Mobile app API extensions

