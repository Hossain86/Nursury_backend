// Vercel serverless function entry point
// This imports and exports the Express app from server.js

const app = require('../server.js');

// Export the Express app as a serverless function for Vercel
module.exports = app;
