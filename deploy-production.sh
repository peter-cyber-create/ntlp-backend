#!/bin/bash
# NTLP Backend Production Deployment Script
# This script prepares the backend for production deployment

set -e

echo "🚀 NTLP Backend Production Deployment"
echo "======================================"

# Check if we're in the correct directory
if [ ! -f "index.js" ] || [ ! -f "package.json" ]; then
    echo "❌ Error: This script must be run from the ntlp-backend directory"
    exit 1
fi

# Ensure we have the correct backend structure
echo "📁 Verifying backend structure..."
REQUIRED_DIRS=("routes" "middleware" "config" "database")
REQUIRED_FILES=("index.js" "package.json")

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ ! -d "$dir" ]; then
        echo "❌ Missing required directory: $dir"
        exit 1
    fi
done

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing required file: $file"
        exit 1
    fi
done

# Remove any Next.js files that shouldn't be in the backend
echo "🧹 Cleaning up incorrect files..."
if [ -d "app" ]; then
    echo "⚠️  Removing Next.js app directory from backend..."
    rm -rf app/
fi

if [ -d "pages" ]; then
    echo "⚠️  Removing Next.js pages directory from backend..."
    rm -rf pages/
fi

if [ -f "next.config.js" ]; then
    echo "⚠️  Removing Next.js config from backend..."
    rm -f next.config.js
fi

if [ -d ".next" ]; then
    echo "⚠️  Removing Next.js build directory from backend..."
    rm -rf .next/
fi

# Install production dependencies
echo "📦 Installing production dependencies..."
npm ci --only=production

# Create production environment template
echo "⚙️  Creating production environment template..."
cat > .env.production << 'EOF'
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/ntlp_conference
JWT_SECRET=your-secure-jwt-secret-key-change-this
NODE_ENV=production
FRONTEND_URL=http://localhost:3000

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=
EMAIL_PASS=

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ntlp_conference
DB_USER=postgres
DB_PASS=password
EOF

# Create PM2 ecosystem file for production
echo "🔧 Creating PM2 ecosystem configuration..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'ntlp-backend',
    script: 'index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
EOF

# Create logs directory
mkdir -p logs

# Update deployment documentation
echo "📚 Updating deployment documentation..."
cat > PRODUCTION_DEPLOYMENT.md << 'EOF'
# NTLP Backend Production Deployment Guide

## Quick Deployment

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd ntlp-backend
   chmod +x deploy-production.sh
   ./deploy-production.sh
   ```

2. **Database Setup**
   ```bash
   # Create database
   sudo -u postgres createdb ntlp_conference
   
   # Run migrations
   psql -U postgres -d ntlp_conference -f database/schema.sql
   psql -U postgres -d ntlp_conference -f database/migrate_registrations_schema.sql
   ```

3. **Environment Configuration**
   ```bash
   cp .env.production .env
   # Edit .env with your actual values
   nano .env
   ```

4. **Start with PM2**
   ```bash
   npm install -g pm2
   pm2 start ecosystem.config.js --env production
   pm2 save
   pm2 startup
   ```

## API Endpoints

- **Health Check**: `GET /health`
- **Registrations**: `POST /api/registrations`
- **Contacts**: `POST /api/contacts`
- **API Documentation**: `GET /api`

## Enhanced Notification System

All API responses include notification metadata for improved UX:

```json
{
  "success": true,
  "message": "Registration successful",
  "data": {...},
  "notification": {
    "type": "success",
    "title": "Success",
    "message": "Registration completed successfully",
    "duration": 3000,
    "icon": "✅"
  }
}
```

## Troubleshooting

- **Check logs**: `pm2 logs ntlp-backend`
- **Restart service**: `pm2 restart ntlp-backend`
- **Check status**: `pm2 status`
- **Database connection**: `psql -U postgres -d ntlp_conference -c "SELECT version();"`
EOF

echo "✅ Backend production deployment preparation completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Copy .env.production to .env and configure with your actual values"
echo "2. Set up PostgreSQL database and run migrations"
echo "3. Deploy to production server"
echo "4. Start with PM2: pm2 start ecosystem.config.js --env production"
echo ""
echo "📖 See PRODUCTION_DEPLOYMENT.md for detailed instructions"
