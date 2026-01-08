module.exports = {
  // User Roles
  USER_ROLES: {
    ADMIN: 'admin',
    MANAGER: 'manager',
    STAFF: 'staff',
    ACCOUNTANT: 'accountant',
  },

  // Order Status
  ORDER_STATUS: {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    READY: 'ready',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
  },

  // Payment Methods
  PAYMENT_METHODS: {
    CASH: 'cash',
    CARD: 'card',
    UPI: 'upi',
    BANK_TRANSFER: 'bank_transfer',
    CHEQUE: 'cheque',
  },

  // Transaction Types
  TRANSACTION_TYPES: {
    SALE: 'sale',
    PURCHASE: 'purchase',
    PAYMENT_RECEIVED: 'payment_received',
    PAYMENT_MADE: 'payment_made',
    LOAN_GIVEN: 'loan_given',
    LOAN_RECEIVED: 'loan_received',
    EXPENSE: 'expense',
    CREDIT_NOTE: 'credit_note',
    DEBIT_NOTE: 'debit_note',
  },

  // Loan Status
  LOAN_STATUS: {
    ACTIVE: 'active',
    PARTIALLY_PAID: 'partially_paid',
    CLOSED: 'closed',
  },

  // Metal Types
  METAL_TYPES: {
    GOLD: 'gold',
    SILVER: 'silver',
    PLATINUM: 'platinum',
  },

  // Purity Standards
  PURITY_STANDARDS: {
    GOLD: ['24K', '22K', '18K', '14K'],
    SILVER: ['999', '925', '835'],
    PLATINUM: ['950', '900', '850'],
  },

  // Item Categories
  ITEM_CATEGORIES: {
    RING: 'ring',
    NECKLACE: 'necklace',
    EARRING: 'earring',
    BRACELET: 'bracelet',
    CHAIN: 'chain',
    PENDANT: 'pendant',
    BANGLE: 'bangle',
    ANKLET: 'anklet',
    OTHER: 'other',
  },

  // Relation Types
  RELATION_TYPES: ['S/O', 'D/O', 'W/O', 'C/O'],

  // GST Rates
  GST_RATES: [0, 3, 5, 12, 18, 28],

  // Default Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // Date Formats
  DATE_FORMAT: 'YYYY-MM-DD',
  DATETIME_FORMAT: 'YYYY-MM-DD HH:mm:ss',
};

