#!/bin/bash

# NTLP Frontend-Backend Integration Script
# This script integrates the NTLP frontend with the PostgreSQL backend

echo "🚀 Starting NTLP Frontend-Backend Integration..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the frontend root directory."
    exit 1
fi

# Backup current configuration
echo "📦 Backing up current configuration..."
cp .env.local .env.local.backup 2>/dev/null || echo "No .env.local found to backup"
cp package.json package.json.backup

# Update package.json to use port 3000
echo "🔧 Updating package.json scripts..."
sed -i 's/next dev -p 3001/next dev -p 3000/g' package.json
sed -i 's/next start -p 3001/next start -p 3000/g' package.json

# Check if scripts need to be added
if ! grep -q "\"dev\":" package.json; then
    # Add dev script if missing
    sed -i 's/"scripts": {/"scripts": {\n    "dev": "next dev -p 3000",/' package.json
fi

# Update environment configuration
echo "⚙️  Updating environment configuration..."
cat > .env.local << 'EOF'
# Local Development Environment Configuration
NODE_ENV=development

# Application Details
NEXT_PUBLIC_APP_NAME="The Communicable and Non-Communicable Diseases Conference 2025"
NEXT_PUBLIC_APP_DESCRIPTION="Uganda's premier Communicable and Non-Communicable Diseases Conference 2025 - Integrated Health Systems for a Resilient Future: Harnessing Technology in Combating Diseases"
NEXT_PUBLIC_APP_VERSION="1.0.0"
NEXT_PUBLIC_APP_ENV="development"
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Backend API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_API_TIMEOUT=30000

# Event Theme
NEXT_PUBLIC_EVENT_THEME="Integrated Health Systems for a Resilient Future: Harnessing Technology in Combating Diseases"

# Security Configuration (Development)
NEXT_PUBLIC_CSP_NONCE_ENABLED=false
NEXT_PUBLIC_RATE_LIMITING_ENABLED=false
JWT_SECRET=dev_jwt_secret_key_for_local_development
SESSION_SECRET=dev_session_secret_key_for_local_development

# File Upload Configuration
MAX_FILE_SIZE=10485760

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev_nextauth_secret_for_local_development

# Conference Settings
CONFERENCE_NAME="NDC Conference 2025"
CONFERENCE_YEAR=2025
CONFERENCE_VENUE="Conference Center"

# Development specific settings
NEXT_PUBLIC_DEBUG=true

# Backend Integration
NEXT_PUBLIC_BACKEND_HOST=localhost
NEXT_PUBLIC_BACKEND_PORT=5000
NEXT_PUBLIC_ENABLE_API_LOGGING=true
EOF

# Copy the enhanced API client
echo "📋 Copying enhanced API client..."
if [ -f "../ntlp-backend/frontend-integration/ntlp-api-client.js" ]; then
    cp ../ntlp-backend/frontend-integration/ntlp-api-client.js lib/
    echo "✅ Enhanced API client copied"
else
    echo "⚠️  Enhanced API client not found, using existing client"
fi

# Update next.config.js for proper API integration
echo "🔧 Updating Next.js configuration..."
cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  
  // API rewrites for development
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/:path*`,
      },
    ];
  },
  
  // CORS headers for development
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
EOF

echo "✅ Frontend-Backend Integration Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Start the backend: cd ../ntlp-backend && npm start"
echo "2. Start the frontend: npm run dev"
echo "3. Frontend will be available at: http://localhost:3000"
echo "4. Backend API will be available at: http://localhost:5000"
echo ""
echo "🚀 For VM deployment:"
echo "1. Update YOUR_VM_IP in .env.production with your actual VM IP"
echo "2. Run the deploy.sh script from the backend directory"
echo "3. Copy this frontend to the VM and run npm run build && npm start"
