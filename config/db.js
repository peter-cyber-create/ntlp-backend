const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration with environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME || 'conf',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'toor',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
  queueLimit: 0,
  acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 60000,
  timeout: parseInt(process.env.DB_TIMEOUT) || 60000,
  reconnect: true,
  charset: 'utf8mb4',
  collation: 'utf8mb4_unicode_ci'
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connection successful');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Graceful shutdown
const closePool = async () => {
  try {
    await pool.end();
    console.log('Database pool closed successfully');
  } catch (error) {
    console.error('Error closing database pool:', error);
  }
};

// Health check for database
const healthCheck = async () => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT NOW() as now');
    connection.release();
    return {
      status: 'healthy',
      timestamp: rows[0].now,
      connections: {
        total: pool.pool.config.connectionLimit,
        idle: pool.pool.config.connectionLimit - pool.pool._allConnections.length,
        active: pool.pool._allConnections.length
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// Export functions and pool
module.exports = {
  pool,
  testConnection,
  closePool,
  healthCheck
};
