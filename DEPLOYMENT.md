# NTLP Conference System - Production Deployment Guide

## 🚀 VM Deployment Instructions

### Prerequisites
- Ubuntu/Linux VM with SSH access
- Node.js 18+ installed
- PostgreSQL 12+ installed
- Git installed
- Domain name (optional) or use IP address

### 📦 Deployment Steps

#### 1. Clone the Repository
```bash
# On your VM
git clone https://github.com/peter-cyber-create/ntlp-backend.git
cd ntlp-backend
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit the environment variables
nano .env
```

#### 4. Database Setup
```bash
# Create PostgreSQL database
sudo -u postgres createdb ntlp_conference

# Run database schema
npm run db:setup

# Optional: Add sample data
npm run db:seed
```

#### 5. Start the Server
```bash
# Development mode
npm run dev

# Production mode (recommended for VM)
npm start
```

### 🌐 Production Environment Variables

Update your `.env` file with production values:

```bash
# Server Configuration
PORT=5000
NODE_ENV=production
FRONTEND_URL=http://your-vm-ip:3000

# Database Configuration (Update with your PostgreSQL credentials)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ntlp_conference
DB_USER=postgres
DB_PASS=your_secure_password

# Security (Generate secure values)
JWT_SECRET=your-super-secure-jwt-secret-key-64-chars-long
API_KEY=your-secure-api-key

# Email Configuration (Configure with your SMTP provider)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=NTLP Conference <noreply@ntlp-conference.org>

# Admin Configuration
ADMIN_EMAIL=admin@ntlp-conference.org
ADMIN_PASSWORD=secure-admin-password

# Conference Information
CONFERENCE_NAME=NTLP Conference 2025
CONFERENCE_EMAIL=contact@ntlp-conference.org
CONFERENCE_PHONE=+1 (555) 123-4567
CONFERENCE_WEBSITE=https://your-domain.com
```

### 🔧 Process Management (Recommended)

Install PM2 for production process management:

```bash
# Install PM2 globally
npm install -g pm2

# Start the application with PM2
pm2 start index.js --name "ntlp-backend"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### 🔥 Firewall Configuration

```bash
# Allow required ports
sudo ufw allow 22    # SSH
sudo ufw allow 5000  # Backend API
sudo ufw allow 3000  # Frontend (if hosting frontend on same VM)
sudo ufw enable
```

### 📊 Health Monitoring

Once deployed, verify the system:

```bash
# Check backend health
curl http://your-vm-ip:5000/health

# Check API documentation
curl http://your-vm-ip:5000/api

# Test contact endpoint
curl -X POST http://your-vm-ip:5000/api/contacts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "subject": "Test Message",
    "message": "Testing the deployment"
  }'
```

### 🌐 Domain Configuration (Optional)

If you have a domain name:

1. Point your domain to your VM IP
2. Update `FRONTEND_URL` in `.env`
3. Consider setting up SSL with Let's Encrypt

### 📱 Frontend Integration

Your frontend should connect to:
```javascript
// Frontend environment
NEXT_PUBLIC_API_URL=http://your-vm-ip:5000
// Or with domain:
NEXT_PUBLIC_API_URL=https://api.your-domain.com
```

### 🔐 Security Checklist

- [ ] Strong passwords for database and admin
- [ ] Firewall configured properly
- [ ] SSL certificate installed (for production)
- [ ] Environment variables secured
- [ ] Database access restricted
- [ ] Regular backups configured

### 📝 Logs and Monitoring

```bash
# View PM2 logs
pm2 logs ntlp-backend

# View system logs
journalctl -u postgresql
```

## 🎯 Quick Start Commands

```bash
# One-line deployment (after SSH into VM)
curl -o deploy.sh https://raw.githubusercontent.com/peter-cyber-create/ntlp-backend/main/deploy.sh && chmod +x deploy.sh && ./deploy.sh
```
