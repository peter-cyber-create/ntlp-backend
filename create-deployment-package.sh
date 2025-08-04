#!/bin/bash
# Complete NTLP Site Deployment Script
# This script prepares both backend and frontend for production

set -e

echo "🚀 NTLP Complete Site Deployment"
echo "=================================="

# Navigate to project root
cd "$(dirname "$0")"

# Create deployment directory
DEPLOY_DIR="ntlp-production-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$DEPLOY_DIR"

echo "📦 Creating production deployment package in: $DEPLOY_DIR"

# Copy backend files
echo "📋 Copying backend files..."
mkdir -p "$DEPLOY_DIR/backend"
cp -r routes middleware config database index.js package.json package-lock.json .env.example ecosystem.config.js "$DEPLOY_DIR/backend/"

# Create production-ready backend .env
cat > "$DEPLOY_DIR/backend/.env" << 'EOF'
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/ntlp_conference
JWT_SECRET=ntlp-conference-production-secret-2025
NODE_ENV=production
FRONTEND_URL=http://172.27.0.9:3000

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=
EMAIL_PASS=
EOF

# Create deployment instructions
cat > "$DEPLOY_DIR/DEPLOYMENT_INSTRUCTIONS.md" << 'EOF'
# NTLP Production Deployment Instructions

## Server Requirements
- Ubuntu/Debian Linux
- Node.js 18+
- PostgreSQL 12+
- PM2 process manager
- Nginx (recommended)

## Quick Deployment

### 1. Upload Files
```bash
# Upload the entire deployment package to server
scp -r ntlp-production-* user@your-server:/opt/
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd /opt/ntlp-production-*/backend

# Install dependencies
npm ci --only=production

# Setup database
sudo -u postgres createdb ntlp_conference
sudo -u postgres psql -d ntlp_conference -f database/schema.sql
sudo -u postgres psql -d ntlp_conference -f database/migrate_registrations_schema.sql

# Edit environment variables
nano .env

# Install PM2 globally
npm install -g pm2

# Start backend
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 3. Test Deployment
```bash
# Test health endpoint
curl http://localhost:5000/health

# Test registration
curl -X POST http://localhost:5000/api/registrations \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Test","last_name":"User","email":"test@example.com","phone":"123456789","organization":"Test Org","position":"Developer","district":"Kampala","registration_type":"professional"}'
```

## API Endpoints
- Health Check: `GET /health`
- Registrations: `POST /api/registrations`
- Contacts: `POST /api/contacts`
- Users: `GET/POST/PUT/DELETE /api/registrations`
- Activities: `GET/POST/PUT/DELETE /api/activities`
- Sessions: `GET/POST/PUT/DELETE /api/sessions`
- Speakers: `GET/POST/PUT/DELETE /api/speakers`

## Enhanced Notification System
All endpoints return structured responses with notification metadata for improved UX.

## Database Schema
The system includes tables for:
- registrations (with organization and district fields)
- contacts
- activities
- sessions
- speakers
- abstracts
- reviews

## Troubleshooting
- Check logs: `pm2 logs`
- Restart: `pm2 restart all`
- Status: `pm2 status`
- Database: `sudo -u postgres psql -d ntlp_conference`
EOF

# Create production start script
cat > "$DEPLOY_DIR/backend/start-production.sh" << 'EOF'
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
EOF

chmod +x "$DEPLOY_DIR/backend/start-production.sh"

# Create database setup script
cat > "$DEPLOY_DIR/setup-database.sh" << 'EOF'
#!/bin/bash
# Database setup script for NTLP

echo "🗄️ Setting up NTLP Database"

# Create database if it doesn't exist
sudo -u postgres createdb ntlp_conference 2>/dev/null || echo "Database already exists"

# Run schema
echo "📋 Creating database schema..."
sudo -u postgres psql -d ntlp_conference -f backend/database/schema.sql

# Run migration
echo "🔄 Running migrations..."
sudo -u postgres psql -d ntlp_conference -f backend/database/migrate_registrations_schema.sql

# Verify setup
echo "✅ Verifying database setup..."
sudo -u postgres psql -d ntlp_conference -c "\dt"

echo "✅ Database setup completed!"
EOF

chmod +x "$DEPLOY_DIR/setup-database.sh"

# Create complete deployment archive
echo "📦 Creating deployment archive..."
tar -czf "${DEPLOY_DIR}.tar.gz" "$DEPLOY_DIR"

echo "✅ Deployment package created successfully!"
echo ""
echo "📁 Deployment files:"
echo "   Directory: $DEPLOY_DIR/"
echo "   Archive:   ${DEPLOY_DIR}.tar.gz"
echo ""
echo "📋 To deploy:"
echo "   1. Upload ${DEPLOY_DIR}.tar.gz to your server"
echo "   2. Extract: tar -xzf ${DEPLOY_DIR}.tar.gz"
echo "   3. Follow instructions in DEPLOYMENT_INSTRUCTIONS.md"
echo ""
echo "🚀 Ready for production deployment!"
