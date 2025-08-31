#!/bin/bash

# NTLP Backend Production Deployment Script
# This script sets up the production environment with proper security and monitoring

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="ntlp-backend"
APP_DIR="/opt/ntlp-backend"
SERVICE_USER="ntlp"
SERVICE_GROUP="ntlp"
LOG_DIR="/var/log/ntlp"
UPLOAD_DIR="/var/ntlp/uploads"
BACKUP_DIR="/var/ntlp/backups"

echo -e "${BLUE}🚀 Starting NTLP Backend Production Deployment${NC}"

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}❌ This script should not be run as root${NC}"
   exit 1
fi

# Check if required tools are installed
echo -e "${YELLOW}📋 Checking system requirements...${NC}"

command -v node >/dev/null 2>&1 || { echo -e "${RED}❌ Node.js is required but not installed${NC}" >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}❌ npm is required but not installed${NC}" >&2; exit 1; }
command -v pm2 >/dev/null 2>&1 || { echo -e "${RED}❌ PM2 is required but not installed${NC}" >&2; exit 1; }
command -v psql >/dev/null 2>&1 || { echo -e "${RED}❌ PostgreSQL client is required but not installed${NC}" >&2; exit 1; }

echo -e "${GREEN}✅ System requirements met${NC}"

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js 18+ is required. Current version: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js version: $(node -v)${NC}"

# Create service user and group if they don't exist
echo -e "${YELLOW}👤 Setting up service user...${NC}"

if ! getent group $SERVICE_GROUP >/dev/null 2>&1; then
    sudo groupadd $SERVICE_GROUP
    echo -e "${GREEN}✅ Created group: $SERVICE_GROUP${NC}"
fi

if ! getent passwd $SERVICE_USER >/dev/null 2>&1; then
    sudo useradd -r -g $SERVICE_GROUP -s /bin/false -d $APP_DIR $SERVICE_USER
    echo -e "${GREEN}✅ Created user: $SERVICE_USER${NC}"
fi

# Create application directory structure
echo -e "${YELLOW}📁 Creating directory structure...${NC}"

sudo mkdir -p $APP_DIR
sudo mkdir -p $LOG_DIR
sudo mkdir -p $UPLOAD_DIR
sudo mkdir -p $BACKUP_DIR
sudo mkdir -p $APP_DIR/logs
sudo mkdir -p $APP_DIR/uploads

# Set proper permissions
sudo chown -R $SERVICE_USER:$SERVICE_GROUP $APP_DIR
sudo chown -R $SERVICE_USER:$SERVICE_GROUP $LOG_DIR
sudo chown -R $SERVICE_USER:$SERVICE_GROUP $UPLOAD_DIR
sudo chown -R $SERVICE_USER:$SERVICE_GROUP $BACKUP_DIR

sudo chmod 755 $APP_DIR
sudo chmod 755 $LOG_DIR
sudo chmod 755 $UPLOAD_DIR
sudo chmod 700 $BACKUP_DIR

echo -e "${GREEN}✅ Directory structure created${NC}"

# Copy application files
echo -e "${YELLOW}📦 Copying application files...${NC}"

# Copy current directory contents to app directory
sudo cp -r . $APP_DIR/
sudo chown -R $SERVICE_USER:$SERVICE_GROUP $APP_DIR

echo -e "${GREEN}✅ Application files copied${NC}"

# Install dependencies
echo -e "${YELLOW}📚 Installing dependencies...${NC}"

cd $APP_DIR
sudo -u $SERVICE_USER npm ci --only=production

echo -e "${GREEN}✅ Dependencies installed${NC}"

# Create environment file
echo -e "${YELLOW}⚙️ Setting up environment configuration...${NC}"

if [ ! -f "$APP_DIR/.env" ]; then
    echo -e "${YELLOW}⚠️  No .env file found. Please create one based on env.example${NC}"
    echo -e "${BLUE}📝 Copy env.example to .env and configure your production values${NC}"
    sudo cp $APP_DIR/env.example $APP_DIR/.env
    sudo chown $SERVICE_USER:$SERVICE_GROUP $APP_DIR/.env
    sudo chmod 600 $APP_DIR/.env
else
    echo -e "${GREEN}✅ Environment file found${NC}"
fi

# Create systemd service file
echo -e "${YELLOW}🔧 Creating systemd service...${NC}"

sudo tee /etc/systemd/system/ntlp-backend.service > /dev/null <<EOF
[Unit]
Description=NTLP Backend API
Documentation=https://github.com/your-org/ntlp-backend
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=$SERVICE_USER
Group=$SERVICE_GROUP
WorkingDirectory=$APP_DIR
Environment=NODE_ENV=production
Environment=PATH=$APP_DIR/node_modules/.bin:/usr/local/bin:/usr/bin:/bin
ExecStart=/usr/bin/node index.js
ExecReload=/bin/kill -HUP \$MAINPID
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=ntlp-backend

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$LOG_DIR $UPLOAD_DIR $BACKUP_DIR
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true
RestrictRealtime=true
RestrictSUIDSGID=true
LockPersonality=true
MemoryDenyWriteExecute=true

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable service
sudo systemctl daemon-reload
sudo systemctl enable ntlp-backend.service

echo -e "${GREEN}✅ Systemd service created and enabled${NC}"

# Create logrotate configuration
echo -e "${YELLOW}📝 Setting up log rotation...${NC}"

sudo tee /etc/logrotate.d/ntlp-backend > /dev/null <<EOF
$LOG_DIR/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 644 $SERVICE_USER $SERVICE_GROUP
    postrotate
        systemctl reload ntlp-backend.service > /dev/null 2>&1 || true
    endscript
}
EOF

echo -e "${GREEN}✅ Log rotation configured${NC}"

# Create firewall rules (if ufw is available)
if command -v ufw >/dev/null 2>&1; then
    echo -e "${YELLOW}🔥 Configuring firewall...${NC}"
    
    # Allow SSH (port 22)
    sudo ufw allow 22/tcp
    
    # Allow HTTP/HTTPS (ports 80, 443)
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    
    # Allow application port (default 5000)
    sudo ufw allow 5000/tcp
    
    # Allow PostgreSQL (port 5432) - only from localhost
    sudo ufw allow from 127.0.0.1 to any port 5432
    
    echo -e "${GREEN}✅ Firewall rules configured${NC}"
fi

# Create backup script
echo -e "${YELLOW}💾 Creating backup script...${NC}"

sudo tee $APP_DIR/backup.sh > /dev/null <<EOF
#!/bin/bash
# NTLP Backend Backup Script

BACKUP_DIR="$BACKUP_DIR"
DB_NAME="ntlp_conference"
DB_USER="ntlp_user"
TIMESTAMP=\$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="ntlp_backup_\$TIMESTAMP.sql"

# Create database backup
pg_dump -U \$DB_USER -d \$DB_NAME > "\$BACKUP_DIR/\$BACKUP_FILE"

# Compress backup
gzip "\$BACKUP_DIR/\$BACKUP_FILE"

# Remove backups older than 30 days
find \$BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: \$BACKUP_FILE.gz"
EOF

sudo chmod +x $APP_DIR/backup.sh
sudo chown $SERVICE_USER:$SERVICE_GROUP $APP_DIR/backup.sh

# Create cron job for automatic backups
echo -e "${YELLOW}⏰ Setting up automatic backups...${NC}"

# Add backup cron job (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * $APP_DIR/backup.sh >> $LOG_DIR/backup.log 2>&1") | crontab -

echo -e "${GREEN}✅ Automatic backups configured${NC}"

# Create health check script
echo -e "${YELLOW}🏥 Creating health check script...${NC}"

sudo tee $APP_DIR/health-check.sh > /dev/null <<EOF
#!/bin/bash
# NTLP Backend Health Check Script

HEALTH_URL="http://localhost:5000/health"
LOG_FILE="$LOG_DIR/health-check.log"

# Check if service is responding
if curl -f -s \$HEALTH_URL > /dev/null; then
    echo "\$(date): Health check passed" >> \$LOG_FILE
    exit 0
else
    echo "\$(date): Health check failed" >> \$LOG_FILE
    # Restart service if health check fails
    systemctl restart ntlp-backend.service
    exit 1
fi
EOF

sudo chmod +x $APP_DIR/health-check.sh
sudo chown $SERVICE_USER:$SERVICE_GROUP $APP_DIR/health-check.sh

# Add health check cron job (every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * $APP_DIR/health-check.sh") | crontab -

echo -e "${GREEN}✅ Health monitoring configured${NC}"

# Create PM2 ecosystem file
echo -e "${YELLOW}🚀 Setting up PM2 configuration...${NC}"

sudo tee $APP_DIR/ecosystem.config.cjs > /dev/null <<EOF
module.exports = {
  apps: [{
    name: 'ntlp-backend',
    script: 'index.js',
    cwd: '$APP_DIR',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '$LOG_DIR/pm2-error.log',
    out_file: '$LOG_DIR/pm2-out.log',
    log_file: '$LOG_DIR/pm2-combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads'],
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
EOF

sudo chown $SERVICE_USER:$SERVICE_GROUP $APP_DIR/ecosystem.config.cjs

echo -e "${GREEN}✅ PM2 configuration created${NC}"

# Set up monitoring and logging
echo -e "${YELLOW}📊 Setting up monitoring...${NC}"

# Create monitoring script
sudo tee $APP_DIR/monitor.sh > /dev/null <<EOF
#!/bin/bash
# NTLP Backend Monitoring Script

LOG_FILE="$LOG_DIR/monitor.log"
DATE=\$(date '+%Y-%m-%d %H:%M:%S')

# Check memory usage
MEMORY=\$(free -m | awk 'NR==2{printf "%.2f%%", \$3*100/\$2 }')
# Check disk usage
DISK=\$(df -h | awk '\$NF=="/"{printf "%s", \$5}')
# Check CPU load
CPU=\$(top -bn1 | grep "Cpu(s)" | awk '{print \$2}' | awk -F'%' '{print \$1}')

echo "[\$DATE] Memory: \$MEMORY, Disk: \$DISK, CPU: \$CPU%" >> \$LOG_FILE

# Alert if memory usage is high (>80%)
if [ \${MEMORY%.*} -gt 80 ]; then
    echo "[\$DATE] WARNING: High memory usage (\$MEMORY)" >> \$LOG_FILE
fi

# Alert if disk usage is high (>90%)
if [ \${DISK%?} -gt 90 ]; then
    echo "[\$DATE] WARNING: High disk usage (\$DISK)" >> \$LOG_FILE
fi
EOF

sudo chmod +x $APP_DIR/monitor.sh
sudo chown $SERVICE_USER:$SERVICE_GROUP $APP_DIR/monitor.sh

# Add monitoring cron job (every 10 minutes)
(crontab -l 2>/dev/null; echo "*/10 * * * * $APP_DIR/monitor.sh") | crontab -

echo -e "${GREEN}✅ Monitoring configured${NC}"

# Final setup and start
echo -e "${YELLOW}🚀 Starting service...${NC}"

# Start the service
sudo systemctl start ntlp-backend.service

# Wait a moment for service to start
sleep 5

# Check service status
if sudo systemctl is-active --quiet ntlp-backend.service; then
    echo -e "${GREEN}✅ Service started successfully${NC}"
else
    echo -e "${RED}❌ Service failed to start${NC}"
    sudo systemctl status ntlp-backend.service
    exit 1
fi

# Display service information
echo -e "${BLUE}📋 Service Information:${NC}"
echo -e "Service Name: ntlp-backend"
echo -e "Status: \$(sudo systemctl is-active ntlp-backend.service)"
echo -e "Logs: journalctl -u ntlp-backend.service -f"
echo -e "App Directory: $APP_DIR"
echo -e "Log Directory: $LOG_DIR"
echo -e "Upload Directory: $UPLOAD_DIR"
echo -e "Backup Directory: $BACKUP_DIR"

# Display useful commands
echo -e "${BLUE}🔧 Useful Commands:${NC}"
echo -e "Start service: sudo systemctl start ntlp-backend.service"
echo -e "Stop service: sudo systemctl stop ntlp-backend.service"
echo -e "Restart service: sudo systemctl restart ntlp-backend.service"
echo -e "View logs: sudo journalctl -u ntlp-backend.service -f"
echo -e "Check status: sudo systemctl status ntlp-backend.service"
echo -e "Manual backup: sudo -u $SERVICE_USER $APP_DIR/backup.sh"
echo -e "Health check: curl http://localhost:5000/health"

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${YELLOW}⚠️  Remember to:${NC}"
echo -e "  1. Configure your .env file with production values"
echo -e "  2. Set up SSL/TLS certificates for HTTPS"
echo -e "  3. Configure your database with proper credentials"
echo -e "  4. Test the application thoroughly"
echo -e "  5. Set up monitoring and alerting"




