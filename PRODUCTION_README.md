# NTLP Backend - Production Deployment Guide

This guide covers the production deployment of the NTLP Backend API with enterprise-grade security, monitoring, and scalability features.

## 🚀 Quick Start

1. **Clone and setup:**
   ```bash
   git clone <your-repo>
   cd ntlp-backend
   cp env.example .env
   # Edit .env with your production values
   ```

2. **Run deployment script:**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

## 📋 Prerequisites

### System Requirements
- **OS:** Ubuntu 20.04+ / CentOS 8+ / RHEL 8+
- **Node.js:** 18.x or higher
- **PostgreSQL:** 13.x or higher
- **Memory:** Minimum 2GB RAM, Recommended 4GB+
- **Storage:** Minimum 20GB, Recommended 50GB+
- **CPU:** 2+ cores recommended

### Required Software
```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Install PM2 globally
sudo npm install -g pm2

# Install additional tools
sudo apt-get install -y curl wget git ufw fail2ban
```

## 🔐 Security Configuration

### Environment Variables
Create a `.env` file with secure production values:

```bash
# Server Configuration
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ntlp_conference
DB_USER=ntlp_user
DB_PASS=<your_secure_password>
DB_SSL=true

# JWT Configuration (Generate a strong secret)
JWT_SECRET=<generate_64_character_random_string>
JWT_EXPIRES_IN=24h

# Admin Authentication
ADMIN_EMAIL=admin@your-domain.com
ADMIN_PASSWORD_HASH=<bcrypt_hash_of_admin_password>

# Security Configuration
API_KEY=<your_secure_api_key>
SESSION_SECRET=<your_session_secret>
BCRYPT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# CORS Configuration
FRONTEND_URL=https://your-frontend-domain.com
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

### Generate Secure Secrets
```bash
# Generate JWT Secret
openssl rand -base64 64

# Generate API Key
openssl rand -hex 32

# Generate Session Secret
openssl rand -base64 32

# Hash admin password
node -e "const bcrypt = require('bcrypt'); console.log(bcrypt.hashSync('your_admin_password', 12));"
```

## 🗄️ Database Setup

### PostgreSQL Configuration
```bash
# Create database and user
sudo -u postgres psql

CREATE DATABASE ntlp_conference;
CREATE USER ntlp_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE ntlp_conference TO ntlp_user;
ALTER USER ntlp_user CREATEDB;
\q

# Run schema
psql -U ntlp_user -d ntlp_conference -f database/schema.sql

# Optional: Seed with sample data
psql -U ntlp_user -d ntlp_conference -f database/sample-data.sql
```

### Database Security
```bash
# Edit PostgreSQL configuration
sudo nano /etc/postgresql/13/main/postgresql.conf

# Add/modify these lines:
listen_addresses = 'localhost'
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB

# Edit client authentication
sudo nano /etc/postgresql/13/main/pg_hba.conf

# Ensure only local connections for production:
local   all             postgres                                peer
local   all             all                                     md5
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

## 🚀 Deployment

### Automated Deployment
```bash
# Run the deployment script
./deploy.sh
```

### Manual Deployment Steps
If you prefer manual deployment:

1. **Create service user:**
   ```bash
   sudo useradd -r -s /bin/false -d /opt/ntlp-backend ntlp
   ```

2. **Install dependencies:**
   ```bash
   npm ci --only=production
   ```

3. **Set up PM2:**
   ```bash
   pm2 start ecosystem.config.cjs
   pm2 save
   pm2 startup
   ```

4. **Create systemd service:**
   ```bash
   sudo cp ntlp-backend.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable ntlp-backend
   sudo systemctl start ntlp-backend
   ```

## 🔒 Security Hardening

### Firewall Configuration
```bash
# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 5000/tcp
sudo ufw enable
```

### Fail2ban Setup
```bash
# Install fail2ban
sudo apt-get install fail2ban

# Create custom jail for NTLP
sudo tee /etc/fail2ban/jail.local > /dev/null <<EOF
[ntlp-backend]
enabled = true
port = 5000
filter = ntlp-backend
logpath = /var/log/ntlp/combined-*.log
maxretry = 5
bantime = 3600
findtime = 600
EOF

# Create filter
sudo tee /etc/fail2ban/filter.d/ntlp-backend.conf > /dev/null <<EOF
[Definition]
failregex = ^.*"POST /api/admin/login".*" 401 .*$
ignoreregex =
EOF

# Restart fail2ban
sudo systemctl restart fail2ban
```

### SSL/TLS Configuration
```bash
# Install Certbot
sudo apt-get install certbot

# Get SSL certificate
sudo certbot certonly --standalone -d your-domain.com

# Configure Nginx with SSL (if using)
sudo apt-get install nginx
# Edit nginx configuration to include SSL
```

## 📊 Monitoring & Logging

### Health Checks
```bash
# Check service status
curl http://localhost:5000/health

# Check metrics
curl http://localhost:5000/metrics

# View logs
sudo journalctl -u ntlp-backend.service -f
```

### Log Management
```bash
# View application logs
tail -f /var/log/ntlp/combined-*.log

# View error logs
tail -f /var/log/ntlp/error-*.log

# View HTTP logs
tail -f /var/log/ntlp/http-*.log
```

### Performance Monitoring
```bash
# PM2 monitoring
pm2 monit

# System resource monitoring
htop
iotop
nethogs
```

## 🔄 Backup & Recovery

### Database Backups
```bash
# Manual backup
sudo -u ntlp /opt/ntlp-backend/backup.sh

# Check backup status
ls -la /var/ntlp/backups/

# Restore from backup
gunzip -c /var/ntlp/backups/ntlp_backup_YYYYMMDD_HHMMSS.sql.gz | psql -U ntlp_user -d ntlp_conference
```

### Application Backups
```bash
# Backup application files
sudo tar -czf /var/ntlp/backups/app_backup_$(date +%Y%m%d_%H%M%S).tar.gz /opt/ntlp-backend/

# Backup logs
sudo tar -czf /var/ntlp/backups/logs_backup_$(date +%Y%m%d_%H%M%S).tar.gz /var/log/ntlp/
```

## 🚨 Troubleshooting

### Common Issues

1. **Service won't start:**
   ```bash
   # Check logs
   sudo journalctl -u ntlp-backend.service -n 50
   
   # Check environment
   sudo -u ntlp cat /opt/ntlp-backend/.env
   
   # Test database connection
   sudo -u ntlp psql -U ntlp_user -d ntlp_conference -c "SELECT 1;"
   ```

2. **High memory usage:**
   ```bash
   # Check memory usage
   free -h
   
   # Check Node.js memory
   pm2 show ntlp-backend
   
   # Restart service
   sudo systemctl restart ntlp-backend
   ```

3. **Database connection issues:**
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # Check connection limits
   sudo -u postgres psql -c "SHOW max_connections;"
   
   # Check active connections
   sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"
   ```

### Performance Tuning

1. **Node.js Optimization:**
   ```bash
   # Add to ecosystem.config.cjs
   node_args: '--max-old-space-size=2048 --optimize-for-size'
   ```

2. **PostgreSQL Optimization:**
   ```sql
   -- Adjust based on your server specs
   ALTER SYSTEM SET shared_buffers = '512MB';
   ALTER SYSTEM SET effective_cache_size = '2GB';
   ALTER SYSTEM SET work_mem = '8MB';
   SELECT pg_reload_conf();
   ```

3. **PM2 Clustering:**
   ```javascript
   // In ecosystem.config.cjs
   instances: 'max',
   exec_mode: 'cluster',
   max_memory_restart: '2G'
   ```

## 🔍 Security Auditing

### Regular Security Checks
```bash
# Check for vulnerabilities
npm audit

# Check file permissions
find /opt/ntlp-backend -type f -exec ls -la {} \;

# Check service status
sudo systemctl status ntlp-backend

# Check firewall status
sudo ufw status

# Check fail2ban status
sudo fail2ban-client status
```

### Log Analysis
```bash
# Check for suspicious activity
grep "401\|403\|500" /var/log/ntlp/combined-*.log

# Check login attempts
grep "login" /var/log/ntlp/combined-*.log

# Check admin actions
grep "admin" /var/log/ntlp/combined-*.log
```

## 📈 Scaling Considerations

### Horizontal Scaling
- Use load balancer (Nginx, HAProxy)
- Deploy multiple instances
- Use Redis for session storage
- Implement database read replicas

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Use connection pooling
- Implement caching strategies

## 🆘 Support & Maintenance

### Regular Maintenance Tasks
- **Daily:** Check service status and logs
- **Weekly:** Review security logs and performance metrics
- **Monthly:** Update dependencies and security patches
- **Quarterly:** Review and update security policies

### Emergency Procedures
1. **Service Down:** Check logs and restart service
2. **Database Issues:** Check PostgreSQL status and connections
3. **Security Breach:** Isolate server, review logs, update credentials
4. **Performance Issues:** Check resource usage and optimize

### Contact Information
- **System Administrator:** [Your Contact]
- **Security Team:** [Security Contact]
- **Emergency:** [Emergency Contact]

## 📚 Additional Resources

- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [PostgreSQL Performance Tuning](https://www.postgresql.org/docs/current/runtime-config-resource.html)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Systemd Security](https://systemd.io/SECURITY/)

---

**⚠️ Important:** This is a production deployment guide. Always test in a staging environment first and ensure you have proper backup and rollback procedures in place.




