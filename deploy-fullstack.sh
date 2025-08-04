#!/bin/bash

# NTLP Full Stack VM Deployment Script
# This script deploys both backend and frontend to an Ubuntu VM

set -e  # Exit on any error

# Configuration
BACKEND_PORT=5000
FRONTEND_PORT=3000
VM_IP=${1:-"localhost"}  # Use provided IP or localhost as default

echo "🚀 Starting NTLP Full Stack Deployment on VM: $VM_IP"

# Check if we're running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root or with sudo"
    exit 1
fi

# Update system packages
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Node.js 18.x
echo "📋 Installing Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install PostgreSQL
echo "🗄️  Installing PostgreSQL..."
apt install -y postgresql postgresql-contrib

# Install PM2 globally
echo "⚙️  Installing PM2 process manager..."
npm install -g pm2

# Install Git
echo "📋 Installing Git..."
apt install -y git

# Create application directory
echo "📁 Creating application directories..."
mkdir -p /opt/ntlp
cd /opt/ntlp

# Clone or copy the repositories
echo "📥 Setting up backend..."
if [ -d "/home/peter/Desktop/dev/ntlp-backend" ]; then
    cp -r /home/peter/Desktop/dev/ntlp-backend ./backend
else
    echo "Backend directory not found. Please ensure the backend is available."
    exit 1
fi

echo "📥 Setting up frontend..."
if [ -d "/home/peter/Desktop/dev/ntlp" ]; then
    cp -r /home/peter/Desktop/dev/ntlp ./frontend
else
    echo "Frontend directory not found. Please ensure the frontend is available."
    exit 1
fi

# Set up PostgreSQL
echo "🗄️  Configuring PostgreSQL..."
sudo -u postgres psql -c "CREATE USER ntlp_user WITH PASSWORD 'ntlp_password_2024';" || true
sudo -u postgres psql -c "CREATE DATABASE ntlp_conference;" || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ntlp_conference TO ntlp_user;" || true
sudo -u postgres psql -c "ALTER USER ntlp_user CREATEDB;" || true

# Create database tables
echo "📋 Creating database tables..."
sudo -u postgres psql -d ntlp_conference << 'EOF'
-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    phone VARCHAR(20),
    organization VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending',
    response TEXT,
    responded_at TIMESTAMP,
    responded_by VARCHAR(255)
);

-- Create registrations table
CREATE TABLE IF NOT EXISTS registrations (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    institution VARCHAR(255),
    position VARCHAR(255),
    country VARCHAR(100),
    session_track VARCHAR(100),
    registration_type VARCHAR(50) DEFAULT 'academic',
    dietary_requirements TEXT,
    special_needs TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    payment_status VARCHAR(50) DEFAULT 'unpaid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create abstracts table
CREATE TABLE IF NOT EXISTS abstracts (
    id SERIAL PRIMARY KEY,
    registration_id INTEGER REFERENCES registrations(id),
    title VARCHAR(500) NOT NULL,
    abstract_text TEXT NOT NULL,
    keywords TEXT,
    presentation_type VARCHAR(100),
    category VARCHAR(100),
    status VARCHAR(50) DEFAULT 'submitted',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewer_feedback TEXT
);

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ntlp_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ntlp_user;
EOF

# Configure backend environment
echo "⚙️  Configuring backend environment..."
cd /opt/ntlp/backend
cat > .env << EOF
NODE_ENV=production
PORT=$BACKEND_PORT

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=ntlp_user
DB_PASSWORD=ntlp_password_2024
DB_NAME=ntlp_conference

# JWT Configuration
JWT_SECRET=production_jwt_secret_$(openssl rand -hex 32)
JWT_EXPIRES_IN=24h

# Email Configuration (Configure with your SMTP details)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com

# Admin Configuration
ADMIN_EMAIL=admin@conference.com
ADMIN_PASSWORD=admin123
EOF

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install

# Configure frontend environment
echo "⚙️  Configuring frontend environment..."
cd /opt/ntlp/frontend

# Update environment for production
cat > .env.production << EOF
NODE_ENV=production
NEXT_PUBLIC_APP_NAME="The Communicable and Non-Communicable Diseases Conference 2025"
NEXT_PUBLIC_APP_DESCRIPTION="Uganda's premier Communicable and Non-Communicable Diseases Conference 2025"
NEXT_PUBLIC_APP_VERSION="1.0.0"
NEXT_PUBLIC_APP_ENV="production"
NEXT_PUBLIC_APP_URL=http://$VM_IP:$FRONTEND_PORT

# Backend API Configuration
NEXT_PUBLIC_API_URL=http://$VM_IP:$BACKEND_PORT
NEXT_PUBLIC_API_TIMEOUT=30000

# Event Theme
NEXT_PUBLIC_EVENT_THEME="Integrated Health Systems for a Resilient Future: Harnessing Technology in Combating Diseases"

# Security Configuration
NEXT_PUBLIC_CSP_NONCE_ENABLED=true
NEXT_PUBLIC_RATE_LIMITING_ENABLED=true
JWT_SECRET=production_jwt_secret_$(openssl rand -hex 32)
SESSION_SECRET=production_session_secret_$(openssl rand -hex 32)

# NextAuth Configuration
NEXTAUTH_URL=http://$VM_IP:$FRONTEND_PORT
NEXTAUTH_SECRET=production_nextauth_secret_$(openssl rand -hex 32)

# Conference Settings
CONFERENCE_NAME="NDC Conference 2025"
CONFERENCE_YEAR=2025
CONFERENCE_VENUE="Conference Center"

# Production settings
NEXT_PUBLIC_DEBUG=false
NEXT_PUBLIC_BACKEND_HOST=$VM_IP
NEXT_PUBLIC_BACKEND_PORT=$BACKEND_PORT
NEXT_PUBLIC_ENABLE_API_LOGGING=false
EOF

# Install frontend dependencies and build
echo "📦 Installing frontend dependencies..."
npm install

echo "🏗️  Building frontend..."
npm run build

# Configure PM2 for backend
echo "⚙️  Configuring PM2 for backend..."
cd /opt/ntlp/backend
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'ntlp-backend',
    script: 'index.js',
    cwd: '/opt/ntlp/backend',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    log_file: '/var/log/ntlp-backend.log',
    error_file: '/var/log/ntlp-backend-error.log',
    out_file: '/var/log/ntlp-backend-out.log',
    max_memory_restart: '1G'
  }]
};
EOF

# Configure PM2 for frontend
echo "⚙️  Configuring PM2 for frontend..."
cd /opt/ntlp/frontend
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'ntlp-frontend',
    script: 'npm',
    args: 'start',
    cwd: '/opt/ntlp/frontend',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    log_file: '/var/log/ntlp-frontend.log',
    error_file: '/var/log/ntlp-frontend-error.log',
    out_file: '/var/log/ntlp-frontend-out.log',
    max_memory_restart: '1G'
  }]
};
EOF

# Set up log files
echo "📋 Setting up log files..."
mkdir -p /var/log
touch /var/log/ntlp-backend.log /var/log/ntlp-backend-error.log /var/log/ntlp-backend-out.log
touch /var/log/ntlp-frontend.log /var/log/ntlp-frontend-error.log /var/log/ntlp-frontend-out.log
chmod 666 /var/log/ntlp-*

# Start applications with PM2
echo "🚀 Starting applications..."
cd /opt/ntlp/backend
pm2 start ecosystem.config.js

cd /opt/ntlp/frontend
pm2 start ecosystem.config.js

# Save PM2 configuration and set up startup
pm2 save
pm2 startup systemd -u root --hp /root

# Configure firewall
echo "🔥 Configuring firewall..."
ufw allow ssh
ufw allow $BACKEND_PORT
ufw allow $FRONTEND_PORT
ufw --force enable

# Set ownership
chown -R www-data:www-data /opt/ntlp

echo ""
echo "✅ NTLP Full Stack Deployment Complete!"
echo ""
echo "🌐 Application URLs:"
echo "   Frontend: http://$VM_IP:$FRONTEND_PORT"
echo "   Backend API: http://$VM_IP:$BACKEND_PORT"
echo "   Admin Panel: http://$VM_IP:$BACKEND_PORT/admin"
echo ""
echo "📋 Management Commands:"
echo "   View backend logs: pm2 logs ntlp-backend"
echo "   View frontend logs: pm2 logs ntlp-frontend"
echo "   Restart backend: pm2 restart ntlp-backend"
echo "   Restart frontend: pm2 restart ntlp-frontend"
echo "   Stop all: pm2 stop all"
echo "   View status: pm2 status"
echo ""
echo "⚠️  Important: Update email configuration in /opt/ntlp/backend/.env"
echo ""
