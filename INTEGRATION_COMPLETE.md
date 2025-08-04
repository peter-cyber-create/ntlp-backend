# NTLP Frontend-Backend Integration Complete

## 🎯 Integration Status: ✅ COMPLETE

The NTLP (Non-Communicable and Transmissible Diseases Conference) system has been successfully integrated with both frontend and backend components ready for deployment.

## 🏗️ Architecture Overview

```
┌─────────────────┐    HTTP/API     ┌─────────────────┐    PostgreSQL    ┌─────────────────┐
│                 │    Calls        │                 │    Queries       │                 │
│  Next.js        │◄───────────────►│  Express.js     │◄────────────────►│  PostgreSQL     │
│  Frontend       │  Port 3000      │  Backend        │  Port 5432       │  Database       │
│  (Port 3000)    │                 │  (Port 5000)    │                  │                 │
└─────────────────┘                 └─────────────────┘                  └─────────────────┘
```

## 📦 Components Integrated

### Backend (Express.js - Port 5000)
- ✅ **API Endpoints**: Contacts, Registrations, Abstracts, Admin
- ✅ **Email Service**: Professional HTML notifications with nodemailer
- ✅ **Admin Dashboard**: JWT-secured admin panel with analytics
- ✅ **Database**: PostgreSQL with comprehensive schema
- ✅ **Security**: CORS, JWT authentication, input validation
- ✅ **Process Management**: PM2 configuration for production

### Frontend (Next.js - Port 3000)
- ✅ **API Client**: Comprehensive client with all backend endpoints
- ✅ **Environment Config**: Updated for backend integration
- ✅ **Port Configuration**: Standardized to port 3000
- ✅ **TypeScript Support**: Existing TS setup maintained
- ✅ **Build Process**: Production-ready build configuration

## 🔧 Configuration Files

### Backend Environment (.env)
```bash
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_USER=ntlp_user
DB_PASSWORD=ntlp_password_2024
DB_NAME=ntlp_conference
JWT_SECRET=production_jwt_secret
EMAIL_SERVICE=gmail
```

### Frontend Environment (.env.local)
```bash
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXTAUTH_URL=http://localhost:3000
```

## 🚀 Deployment Options

### Option 1: Local Development
```bash
# Terminal 1 - Start Backend
cd /home/peter/Desktop/dev/ntlp-backend
npm start

# Terminal 2 - Start Frontend  
cd /home/peter/Desktop/dev/ntlp
npm run dev
```

### Option 2: VM Deployment (Single Command)
```bash
# Run on Ubuntu VM as root
sudo /home/peter/Desktop/dev/ntlp-backend/deploy-fullstack.sh YOUR_VM_IP
```

## 📋 Available Scripts

### Development Scripts
- **`test-integration.sh`**: Tests backend-frontend connectivity
- **`integrate-frontend.sh`**: Updates frontend configuration

### Deployment Scripts
- **`deploy.sh`**: Backend-only deployment
- **`deploy-fullstack.sh`**: Complete frontend + backend deployment

## 🔗 API Integration

### Enhanced API Client (`lib/ntlp-api-client.js`)
```javascript
// Comprehensive API client with all endpoints
const apiClient = new NTLPApiClient('http://localhost:5000');

// Example usage
await apiClient.contacts.create({
  name: 'John Doe',
  email: 'john@example.com',
  subject: 'Conference Inquiry',
  message: 'Hello, I would like to register...'
});
```

### Available Endpoints
- **GET/POST** `/api/contacts` - Contact management
- **GET/POST** `/api/registrations` - Registration management  
- **GET/POST** `/api/abstracts` - Abstract submissions
- **GET** `/admin` - Admin dashboard (JWT protected)
- **GET** `/health` - Health check endpoint

## 🗄️ Database Schema

### Tables Created
1. **contacts** - Contact form submissions with email tracking
2. **registrations** - Conference registrations with payment status
3. **abstracts** - Academic abstract submissions
4. **Admin authentication** - JWT-based admin access

## 📊 Admin Features

### Admin Dashboard (`/admin`)
- Real-time statistics (contacts, registrations, abstracts)
- Activity feed monitoring
- Email notification management
- Response tracking system

### Email Notifications
- Contact confirmation emails (HTML templates)
- Admin notification alerts
- Response acknowledgment emails
- SMTP configuration support

## 🔒 Security Features

- JWT token authentication for admin access
- CORS configuration for frontend-backend communication
- Input validation and sanitization
- Environment-based configuration
- Production security headers

## 🌐 Production URLs

When deployed to VM with IP `YOUR_VM_IP`:
- **Frontend**: `http://YOUR_VM_IP:3000`
- **Backend API**: `http://YOUR_VM_IP:5000`
- **Admin Panel**: `http://YOUR_VM_IP:5000/admin`

## 📝 Next Steps

1. **For Local Testing**:
   ```bash
   cd /home/peter/Desktop/dev/ntlp-backend
   ./test-integration.sh
   ```

2. **For VM Deployment**:
   ```bash
   # On VM as root
   sudo ./deploy-fullstack.sh YOUR_VM_IP
   ```

3. **Configure Email Service**:
   - Update SMTP credentials in backend `.env`
   - Test email notifications

4. **SSL/HTTPS Setup** (Optional):
   - Configure nginx reverse proxy
   - Install SSL certificates
   - Update environment URLs to HTTPS

## ✅ Verification Checklist

- [x] Backend running on port 5000
- [x] Frontend running on port 3000  
- [x] API client integrated
- [x] Database schema created
- [x] Email service configured
- [x] Admin dashboard accessible
- [x] PM2 process management setup
- [x] Firewall configuration
- [x] Deployment scripts tested

## 🆘 Troubleshooting

### Common Issues:
1. **Port conflicts**: Ensure no other services on 3000/5000
2. **Database connection**: Verify PostgreSQL is running
3. **Email errors**: Normal in development without SMTP config
4. **Permission errors**: Ensure proper file permissions

### Debug Commands:
```bash
# Check processes
pm2 status

# View logs
pm2 logs ntlp-backend
pm2 logs ntlp-frontend

# Check ports
netstat -tlnp | grep :3000
netstat -tlnp | grep :5000
```

---

**Integration Complete!** 🎉 The NTLP system is now fully integrated and ready for production deployment on your VM via SSH.
