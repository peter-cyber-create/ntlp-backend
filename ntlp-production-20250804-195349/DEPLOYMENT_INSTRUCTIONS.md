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
