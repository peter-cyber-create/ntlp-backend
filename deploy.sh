#!/bin/bash

# NTLP Conference Backend - Auto Deployment Script
# This script automates the deployment process on a fresh Ubuntu VM

set -e

echo "🚀 NTLP Conference Backend Deployment Script"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

print_status "Starting NTLP Backend deployment..."

# Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
print_status "Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PostgreSQL
print_status "Installing PostgreSQL..."
if ! command -v psql &> /dev/null; then
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

# Install PM2 globally
print_status "Installing PM2 process manager..."
sudo npm install -g pm2

# Install Git if not present
if ! command -v git &> /dev/null; then
    print_status "Installing Git..."
    sudo apt install -y git
fi

# Clone or update repository
if [ -d "ntlp-backend" ]; then
    print_status "Updating existing repository..."
    cd ntlp-backend
    git pull origin main
else
    print_status "Cloning NTLP Backend repository..."
    git clone https://github.com/peter-cyber-create/ntlp-backend.git
    cd ntlp-backend
fi

# Install npm dependencies
print_status "Installing npm dependencies..."
npm install

# Setup PostgreSQL database
print_status "Setting up PostgreSQL database..."
sudo -u postgres psql -c "CREATE DATABASE ntlp_conference;" 2>/dev/null || print_warning "Database might already exist"
sudo -u postgres psql -c "CREATE USER ntlp_user WITH PASSWORD 'ntlp_secure_pass';" 2>/dev/null || print_warning "User might already exist"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ntlp_conference TO ntlp_user;" 2>/dev/null

# Create environment file
print_status "Creating environment configuration..."
if [ ! -f .env ]; then
    cp .env.example .env
    
    # Get server IP
    SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
    
    # Update environment variables
    sed -i "s/your_password/ntlp_secure_pass/g" .env
    sed -i "s/http:\/\/localhost:3000/http:\/\/$SERVER_IP:3000/g" .env
    sed -i "s/your-super-secret-jwt-key-change-this-in-production/$(openssl rand -base64 64 | tr -d '\n')/g" .env
    sed -i "s/change-this-secure-password/$(openssl rand -base64 32 | tr -d '\n')/g" .env
    
    print_success "Environment file created with server IP: $SERVER_IP"
else
    print_warning "Environment file already exists, skipping..."
fi

# Setup database schema
print_status "Setting up database schema..."
npm run db:setup 2>/dev/null || print_warning "Schema might already exist"

# Optional: Add sample data
read -p "Do you want to add sample data? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Adding sample data..."
    npm run db:seed 2>/dev/null || print_warning "Sample data might already exist"
fi

# Configure firewall
print_status "Configuring firewall..."
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 5000/tcp  # Backend API
sudo ufw allow 3000/tcp  # Frontend
sudo ufw --force enable

# Start application with PM2
print_status "Starting application with PM2..."
pm2 delete ntlp-backend 2>/dev/null || true
pm2 start index.js --name "ntlp-backend"
pm2 save
pm2 startup | tail -1 | sudo bash

# Test the application
print_status "Testing the application..."
sleep 5
if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    print_success "Application is running successfully!"
else
    print_error "Application health check failed"
    exit 1
fi

# Get server information
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')

echo ""
echo "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "====================================="
echo ""
echo "📊 Server Information:"
echo "  • Server IP: $SERVER_IP"
echo "  • Backend API: http://$SERVER_IP:5000"
echo "  • Health Check: http://$SERVER_IP:5000/health"
echo "  • API Documentation: http://$SERVER_IP:5000/api"
echo ""
echo "🔧 Management Commands:"
echo "  • View logs: pm2 logs ntlp-backend"
echo "  • Restart: pm2 restart ntlp-backend"
echo "  • Stop: pm2 stop ntlp-backend"
echo "  • Status: pm2 status"
echo ""
echo "🔐 Admin Access:"
echo "  • Email: admin@ntlp-conference.org"
echo "  • Password: Check your .env file"
echo ""
echo "🌐 Next Steps:"
echo "  1. Update your frontend to use: http://$SERVER_IP:5000"
echo "  2. Configure your domain (optional)"
echo "  3. Setup SSL certificate for production"
echo "  4. Configure email settings in .env"
echo ""
print_success "NTLP Backend is ready for production use!"
