const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up NTLP Conference Backend...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
const envLocalPath = path.join(__dirname, '..', 'env.local');

if (!fs.existsSync(envPath) && fs.existsSync(envLocalPath)) {
  console.log('📝 Creating .env file from env.local...');
  fs.copyFileSync(envLocalPath, envPath);
  console.log('✅ .env file created');
}

// Create uploads directory
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  console.log('📁 Creating uploads directory...');
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Uploads directory created');
}

// Create logs directory
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  console.log('📁 Creating logs directory...');
  fs.mkdirSync(logsDir, { recursive: true });
  console.log('✅ Logs directory created');
}

console.log('\n🎉 Backend setup completed successfully!');
console.log('\nNext steps:');
console.log('1. Update .env file with your database credentials');
console.log('2. Run: mysql -u root -p < database/simple-schema.sql');
console.log('3. Start the server: npm run dev');
