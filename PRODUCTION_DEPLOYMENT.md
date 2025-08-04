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
