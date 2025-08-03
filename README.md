# NTLP Conference Backend API

A comprehensive REST API for managing an NTLP (Natural Language Processing) conference, built with Node.js, Express, and PostgreSQL.

## Features

- 🎯 **Registration Management** - Handle conference registrations with detailed participant information
- 📝 **Abstract Submission System** - Complete paper/abstract submission with file upload support
- 👥 **Peer Review System** - Full peer review workflow with scoring and recommendations
- 🎤 **Speaker Management** - Manage speaker profiles, bios, and contact information
- 📅 **Session Management** - Create and manage conference sessions with speaker assignments
- 🎪 **Activity Management** - Handle workshops, networking events, and social activities
- 📢 **Announcements** - Publish and manage conference announcements
- 🔗 **Session Assignment** - Link accepted abstracts to presentation sessions
- 📊 **Statistics & Analytics** - Comprehensive stats for submissions, reviews, and registrations
- 🔐 **Authentication** - JWT-based authentication with role-based access control
- ✅ **Input Validation** - Comprehensive request validation using express-validator
- 🚦 **Rate Limiting** - Built-in rate limiting for API protection
- 📊 **Health Monitoring** - Health check endpoints for monitoring

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT
- **Validation**: express-validator
- **Logging**: Morgan
- **Environment**: dotenv

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ntlp-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   # Create database
   createdb ntlp_conference
   
   # Run schema
   npm run db:setup
   
   # Seed with sample data (optional)
   npm run db:seed
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

The API will be available at `http://localhost:5000`

## API Endpoints

### Health & Info
- `GET /health` - Health check
- `GET /api` - API documentation

### Registrations
- `POST /api/registrations` - Create new registration
- `GET /api/registrations` - Get all registrations
- `GET /api/registrations/:id` - Get registration by ID
- `PUT /api/registrations/:id` - Update registration
- `DELETE /api/registrations/:id` - Delete registration

### Speakers
- `POST /api/speakers` - Create speaker
- `GET /api/speakers` - Get all speakers
- `GET /api/speakers/:id` - Get speaker by ID
- `PUT /api/speakers/:id` - Update speaker
- `DELETE /api/speakers/:id` - Delete speaker

### Sessions
- `POST /api/sessions` - Create session
- `GET /api/sessions` - Get all sessions
- `GET /api/sessions/:id` - Get session by ID
- `PUT /api/sessions/:id` - Update session
- `DELETE /api/sessions/:id` - Delete session

### Activities
- `POST /api/activities` - Create activity
- `GET /api/activities` - Get all activities
- `GET /api/activities/:id` - Get activity by ID
- `PUT /api/activities/:id` - Update activity
- `DELETE /api/activities/:id` - Delete activity

### Announcements
- `POST /api/announcements` - Create announcement
- `GET /api/announcements` - Get all announcements
- `GET /api/announcements/:id` - Get announcement by ID
- `PUT /api/announcements/:id` - Update announcement
- `DELETE /api/announcements/:id` - Delete announcement

### Abstracts & Paper Submissions
- `POST /api/abstracts` - Submit new abstract/paper
- `GET /api/abstracts` - Get all abstracts (with filtering & pagination)
- `GET /api/abstracts/:id` - Get abstract by ID (includes reviews)
- `PUT /api/abstracts/:id` - Update abstract
- `PATCH /api/abstracts/:id/status` - Update abstract status
- `DELETE /api/abstracts/:id` - Delete abstract
- `GET /api/abstracts/track/:track` - Get abstracts by track
- `GET /api/abstracts/stats/overview` - Get submission statistics

### Peer Reviews
- `POST /api/reviews` - Submit review for abstract
- `GET /api/reviews` - Get all reviews (admin)
- `GET /api/reviews/:id` - Get review by ID
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review
- `GET /api/reviews/abstract/:abstractId` - Get reviews for specific abstract
- `GET /api/reviews/reviewer/:email` - Get reviews by reviewer
- `GET /api/reviews/stats/overview` - Get review statistics

### Contacts & Support
- `POST /api/contacts` - Submit contact message
- `GET /api/contacts` - Get all contact messages (admin)
- `GET /api/contacts/:id` - Get contact message by ID
- `PUT /api/contacts/:id` - Update contact status
- `DELETE /api/contacts/:id` - Delete contact message

### Registration Management
- `POST /api/register/sessions/:sessionId` - Register for session
- `DELETE /api/register/sessions/:sessionId/:registrationId` - Unregister from session
- `POST /api/register/activities/:activityId` - Register for activity
- `DELETE /api/register/activities/:activityId/:registrationId` - Unregister from activity
- `GET /api/register/user/:registrationId` - Get user's registrations

## Database Schema

The database includes the following main tables:

- **registrations** - Conference participant registrations
- **speakers** - Speaker information and profiles
- **sessions** - Conference sessions and presentations
- **activities** - Workshops, networking events, etc.
- **announcements** - Conference announcements
- **abstracts** - Paper/abstract submissions with metadata
- **reviews** - Peer reviews with scores and recommendations
- **contacts** - Contact messages and support inquiries
- **session_registrations** - Many-to-many for session attendance
- **activity_registrations** - Many-to-many for activity participation
- **abstract_sessions** - Links accepted abstracts to presentation sessions

## Environment Variables

Key environment variables to configure:

```env
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ntlp_conference
DB_USER=postgres
DB_PASS=your_password

# Security
JWT_SECRET=your_jwt_secret
API_KEY=your_api_key
```

## API Examples

### Create a Registration
```bash
curl -X POST http://localhost:5000/api/registrations \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@university.edu",
    "institution": "Tech University",
    "registration_type": "academic"
  }'
```

### Get All Sessions
```bash
curl http://localhost:5000/api/sessions
```

### Register for a Session
```bash
curl -X POST http://localhost:5000/api/register/sessions/1 \
  -H "Content-Type: application/json" \
  -d '{"registration_id": 123}'
```

## Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error message",
  "details": ["Detailed validation errors if applicable"],
  "timestamp": "2025-08-02T10:30:00.000Z"
}
```

HTTP status codes used:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## Development

### Running Tests
```bash
npm test
```

### Database Management
```bash
# Reset database
npm run db:setup

# Add sample data
npm run db:seed
```

### Debugging
The application uses Morgan for HTTP request logging and console.error for error logging.

## Security Features

- Rate limiting (1000 requests per 15 minutes)
- Input validation and sanitization
- CORS configuration
- SQL injection prevention through parameterized queries
- JWT token authentication
- API key authentication option

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or issues, please create an issue in the repository or contact the development team.