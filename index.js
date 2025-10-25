const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import database connection
const db = require('./src/models');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const roleRoutes = require('./src/routes/roleRoutes');
const tabRoutes = require('./src/routes/tabRoutes');
const materialRoutes = require('./src/routes/materialRoutes');
const customerRoutes = require('./src/routes/customerRoutes');
const quotationRoutes = require('./src/routes/quotationRoutes');
const purchaseOrderRoutes = require('./src/routes/purchaseOrderRoutes');
const invoiceRoutes = require('./src/routes/invoiceRoutes');
const exportRoutes = require('./src/routes/exportRoutes');
const invoiceGeneratorRoutes = require('./src/routes/invoiceGeneratorRoutes');
const taxRoutes = require('./src/routes/taxRoutes');
const employeeRoutes = require('./src/routes/employeeRoutes');
const employeeSalaryRoutes = require('./src/routes/employeeSalaryRoutes');
const expenseRoutes = require('./src/routes/expenseRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const bankRoutes = require('./src/routes/bankRoutes');
const challanRoutes = require('./src/routes/challanRoutes');
const pdfRoutes = require('./src/routes/pdfRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test database connection
const testDbConnection = async () => {
  try {
    await db.sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
};

// Basic route for health check
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await db.sequelize.authenticate();
    res.status(200).json({
      status: 'OK',
      message: 'Server is running',
      database: 'Connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Server is running but database connection failed',
      database: 'Disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/auth', authRoutes); // Frontend compatibility
app.use('/api/v1/users', userRoutes);
app.use('/api/users', userRoutes); // Frontend compatibility
app.use('/api/v1/roles', roleRoutes);
app.use('/api/roles', roleRoutes); // Frontend compatibility
app.use('/api/v1/tabs', tabRoutes);
app.use('/api/tabs', tabRoutes); // Frontend compatibility
app.use('/api/v1/materials', materialRoutes);
app.use('/api/materials', materialRoutes); // Frontend compatibility
app.use('/api/v1/customers', customerRoutes);
app.use('/api/customers', customerRoutes); // Frontend compatibility
app.use('/api/v1/quotations', quotationRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/v1/purchase-orders', purchaseOrderRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes); // Frontend compatibility
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/invoices', invoiceRoutes); // Frontend compatibility
app.use('/api/v1/export', exportRoutes);
app.use('/api/export', exportRoutes); // Frontend compatibility
app.use('/api/v1/generate', invoiceGeneratorRoutes);
app.use('/api/generate', invoiceGeneratorRoutes); // Frontend compatibility
app.use('/api/v1/tax', taxRoutes);
app.use('/api/tax', taxRoutes); // Frontend compatibility
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/employees', employeeRoutes); // Frontend compatibility
app.use('/api/v1/employee-salaries', employeeSalaryRoutes);
app.use('/api/employee-salaries', employeeSalaryRoutes); // Frontend compatibility
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/expenses', expenseRoutes); // Frontend compatibility
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/dashboard', dashboardRoutes); // Frontend compatibility
app.use('/api/v1/banks', bankRoutes);
app.use('/api/banks', bankRoutes); // Frontend compatibility
app.use('/api/v1/challans', challanRoutes);
app.use('/api/challans', challanRoutes); // Frontend compatibility
app.use('/api/v1/pdf', pdfRoutes);
app.use('/api/pdf', pdfRoutes); // Frontend compatibility

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Health check available at: http://localhost:${PORT}/health`);
  console.log(`🔐 Login API available at: http://localhost:${PORT}/api/v1/auth/login`);
  console.log(`👥 Users API available at: http://localhost:${PORT}/api/v1/users`);
  console.log(`🎭 Roles API available at: http://localhost:${PORT}/api/v1/roles`);
  console.log(`📋 Quotations API available at: http://localhost:${PORT}/api/v1/quotations`);
  console.log(`📦 Purchase Orders API available at: http://localhost:${PORT}/api/v1/purchase-orders`);
  console.log(`🧾 Invoices API available at: http://localhost:${PORT}/api/v1/invoices`);
  console.log(`📋 Challans API available at: http://localhost:${PORT}/api/v1/challans`);
  
  // Test database connection on startup
  await testDbConnection();
});

module.exports = app;