#!/bin/bash
# Production startup script for NTLP Backend

echo "🚀 Starting NTLP Backend in Production Mode"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Start with PM2
echo "🔄 Starting backend with PM2..."
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

echo "✅ NTLP Backend started successfully!"
echo "📊 Check status: pm2 status"
echo "📝 View logs: pm2 logs"
echo "🔍 Health check: curl http://localhost:5000/health"
