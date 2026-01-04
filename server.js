const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8000;

// Serve static files from public directory
app.use(express.static('public'));

// Serve pages directory
app.use('/pages', express.static('pages'));

// Serve assets directory
app.use('/assets', express.static('assets'));

// Root route - serve index or redirect
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Login route
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Payment route - explicit route for payment.html
app.get('/payment.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'payment.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Pages available at http://localhost:${PORT}/pages/`);
});

