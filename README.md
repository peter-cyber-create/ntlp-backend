# NTLP Conference Backend

This is the backend API server for the NTLP Conference Management System, built with Node.js, Express, and MySQL.

## 🚀 Features

- **RESTful API**: Complete CRUD operations for all entities
- **File Management**: Secure file upload and download handling
- **Database Integration**: MySQL database with connection pooling
- **Authentication**: Admin authentication system
- **Validation**: Input validation and sanitization
- **CORS Support**: Cross-origin resource sharing enabled
- **Health Monitoring**: API health checks and monitoring

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MySQL 8.0+
- **ORM**: mysql2 with promise support
- **Middleware**: CORS, Helmet, Morgan
- **File Handling**: Multer for file uploads
- **Validation**: Express validator

## 📁 Project Structure

```
ntlp-backend/
├── config/                 # Configuration files
│   ├── db.js              # Database connection
│   └── logger.js           # Logging configuration
├── database/               # Database files
│   ├── schema.sql          # Database schema
│   └── migrations/         # Database migrations
├── middleware/             # Express middleware
│   ├── auth.js             # Authentication middleware
│   └── validation.js       # Input validation
├── routes/                 # API routes
│   ├── index.js            # Main router
│   ├── registrations.js    # Registration endpoints
│   ├── abstracts.js        # Abstract endpoints
│   ├── contacts.js         # Contact endpoints
│   ├── sponsorships.js     # Sponsorship endpoints
│   └── admin.js            # Admin endpoints
├── uploads/                # File upload directory
├── scripts/                # Utility scripts
├── index.js                # Main server file
├── package.json            # Dependencies
└── .env                    # Environment variables
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8.0+
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   cd ntlp-backend
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.local.example .env
   # Edit .env with your database configuration
   ```

3. **Set up database:**
   ```bash
   mysql -u root -p < database/schema.sql
   ```

4. **Start the server:**
   ```bash
   npm start
   ```

5. **Verify the server is running:**
   ```bash
   curl http://localhost:5000/api/health
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ntlp_conference
DB_PORT=3306

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=2097152  # 2MB in bytes

# Security Configuration
JWT_SECRET=your_jwt_secret_here
CORS_ORIGIN=http://localhost:3000
```

### Database Setup

1. **Create database:**
   ```sql
   CREATE DATABASE ntlp_conference;
   USE ntlp_conference;
   ```

2. **Run schema:**
   ```bash
   mysql -u root -p ntlp_conference < database/schema.sql
   ```

## 📋 Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run lint` - Run ESLint

## 🌐 API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Registrations
- `GET /api/registrations` - List all registrations
- `POST /api/registrations` - Create new registration
- `GET /api/registrations/:id` - Get registration by ID
- `PATCH /api/registrations/:id/status` - Update registration status
- `PATCH /api/registrations/:id/payment` - Update payment status

### Abstracts
- `GET /api/abstracts` - List all abstracts
- `POST /api/abstracts` - Submit new abstract
- `GET /api/abstracts/:id` - Get abstract by ID
- `PATCH /api/abstracts/:id/status` - Update abstract status
- `POST /api/abstracts/:id/review` - Add reviewer comments

### Contacts
- `GET /api/contacts` - List all contact inquiries
- `POST /api/contacts` - Submit new contact inquiry
- `GET /api/contacts/:id` - Get contact by ID
- `PATCH /api/contacts/:id/status` - Update contact status

### Sponsorships
- `GET /api/sponsorships` - List all sponsorship applications
- `POST /api/sponsorships` - Submit new sponsorship application
- `GET /api/sponsorships/:id` - Get sponsorship by ID
- `PATCH /api/sponsorships/:id/status` - Update sponsorship status

### Admin
- `POST /api/admin/login` - Admin authentication
- `GET /api/admin/dashboard` - Admin dashboard data
- `GET /api/admin/stats` - System statistics

## 📊 Database Schema

### Core Tables

- **registrations**: Conference registrations
- **abstracts**: Abstract submissions
- **contacts**: Contact inquiries
- **sponsorships**: Sponsorship applications
- **users**: Admin users
- **files**: File uploads

### Key Fields

Each table includes:
- `id`: Primary key
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp
- `status`: Current status
- Related metadata fields

## 🔒 Security Features

- **Input Validation**: All inputs are validated and sanitized
- **SQL Injection Protection**: Parameterized queries
- **File Upload Security**: File type and size validation
- **CORS Protection**: Configurable cross-origin policies
- **Rate Limiting**: API rate limiting (configurable)
- **Authentication**: JWT-based admin authentication

## 📁 File Management

### Upload Directory Structure

```
uploads/
├── abstracts/              # Abstract files
├── registrations/          # Payment proofs
├── sponsorships/           # Company logos
└── temp/                   # Temporary files
```

### File Validation

- **Supported Types**: PDF, DOC, DOCX, PNG, JPG, JPEG
- **Maximum Size**: 2MB per file
- **Security**: File type verification
- **Storage**: Local file system with backup options

## 🚀 Deployment

### Production Setup

1. **Environment Configuration:**
   ```bash
   cp env.production .env
   # Edit with production values
   ```

2. **Database Setup:**
   ```bash
   mysql -h your_db_host -u your_user -p < database/schema.sql
   ```

3. **Start Production Server:**
   ```bash
   npm start
   ```

### Environment Variables (Production)

```env
NODE_ENV=production
PORT=5000
DB_HOST=your_production_db_host
DB_USER=your_production_db_user
DB_PASSWORD=your_production_db_password
DB_NAME=ntlp_conference
JWT_SECRET=your_secure_jwt_secret
CORS_ORIGIN=https://your-frontend-domain.com
```

## 📈 Monitoring & Logging

### Health Checks

- **API Health**: `/api/health` endpoint
- **Database Status**: Connection pool monitoring
- **File System**: Upload directory status
- **Memory Usage**: Node.js process monitoring

### Logging

- **Request Logging**: Morgan HTTP request logger
- **Error Logging**: Comprehensive error tracking
- **Database Logging**: Query performance monitoring
- **File Operations**: Upload/download tracking

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Failed:**
   - Verify MySQL is running
   - Check connection credentials
   - Ensure database exists

2. **File Upload Fails:**
   - Check upload directory permissions
   - Verify file size limits
   - Check file type restrictions

3. **CORS Errors:**
   - Verify CORS_ORIGIN setting
   - Check frontend URL configuration

### Debug Mode

Enable debug logging:

```bash
DEBUG=* npm start
```

## 🤝 Contributing

1. Follow the existing code style
2. Add proper error handling
3. Include input validation
4. Update API documentation
5. Test all endpoints

## 📞 Support

For technical support or questions about the backend API, please contact the development team.

---

**Built with ❤️ for the NTLP Conference 2025**
