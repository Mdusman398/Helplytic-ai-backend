# Helplytics AI - Strong Backend Architecture

A production-level Node.js + Express + MongoDB backend for the Helplytics AI community support platform.

## 🏗️ Architecture Overview

### Core Features
- ✅ **Multi-role User System**: Need Help, Can Help, or Both
- ✅ **Smart Request Management**: Create, filter, and track help requests
- ✅ **Helper Matching**: Offer help system with acceptance/rejection
- ✅ **Real-time Messaging**: User-to-user conversations
- ✅ **Notification System**: Real-time updates for all events
- ✅ **Leaderboard & Trust Score**: Gamification & reputation system
- ✅ **AI Features**: Auto-categorization, tag suggestions, summaries
- ✅ **Strong Middleware Stack**: Auth, RBAC, validation, error handling, rate limiting

## 📁 Project Structure

```
helphub-ai-backend/
├── config/
│   ├── db.js                    # MongoDB connection
│   └── aiService.js             # AI features (categorization, suggestions)
├── controller/
│   ├── userController.js        # Auth & profile management
│   ├── requestController.js     # Request CRUD operations
│   ├── helperOfferController.js # Helper offers
│   ├── messageController.js     # Messaging system
│   ├── notificationController.js # Notifications
│   └── leaderboardController.js # Rankings & trust scores
├── models/
│   ├── User.js                  # User schema
│   ├── Request.js               # Help request schema
│   ├── HelperOffer.js          # Helper offer schema
│   ├── Message.js              # Message schema
│   ├── Notification.js         # Notification schema
│   ├── Leaderboard.js          # Leaderboard schema
│   └── Review.js               # Review/rating schema
├── routes/
│   ├── userRoute.js            # User endpoints
│   ├── requestRoutes.js        # Request endpoints
│   ├── offerRoutes.js          # Helper offer endpoints
│   ├── messageRoutes.js        # Messaging endpoints
│   ├── notificationRoutes.js   # Notification endpoints
│   └── leaderboardRoutes.js    # Leaderboard endpoints
├── middleware/
│   ├── authMiddleware.js       # JWT authentication
│   ├── roleMiddleware.js       # Role-based access control
│   ├── validationMiddleware.js # Request validation
│   ├── errorHandler.js         # Global error handling
│   ├── logger.js               # Request/error logging
│   └── rateLimiter.js          # Rate limiting
├── validations/
│   ├── userValidation.js       # User schemas (Yup)
│   ├── requestValidation.js    # Request schemas (Yup)
│   └── otherValidation.js      # Message, offer schemas (Yup)
├── server.js                    # Main entry point
├── package.json
└── .env                         # Environment variables
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone and install**
```bash
cd helphub-ai-backend
npm install
```

2. **Configure environment**
```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/helplytics
JWT_SECRET=your_super_secret_jwt_key
REFRESH_TOKEN_SECRET=your_super_secret_refresh_key
FRONTEND_URL=http://localhost:3000
```

3. **Start server**
```bash
npm start
# Server runs on http://localhost:5000
```

## 🔐 Authentication

### JWT Flow
1. User registers/logs in
2. Backend generates **Access Token** (15 min) + **Refresh Token** (7 days)
3. Tokens stored in **HTTP-only cookies**
4. Refresh token saved in database for validation

### Token Refresh
```bash
POST /api/users/refresh-token
```
Returns new access token when expired.

## 📚 API Documentation

### User Endpoints
```
POST   /api/users/register          # Sign up
POST   /api/users/login             # Login
POST   /api/users/refresh-token     # Refresh access token
POST   /api/users/logout            # Logout
GET    /api/users/profile           # Get your profile
GET    /api/users/profile/:id       # Get user by ID
PUT    /api/users/profile           # Update profile
```

### Request Endpoints
```
POST   /api/requests                # Create request
GET    /api/requests                # Get all (with filters)
GET    /api/requests/:id            # Get request detail
PUT    /api/requests/:id            # Update request
DELETE /api/requests/:id            # Delete request
GET    /api/requests/feed/my-requests    # My requests
GET    /api/requests/feed/helped-me     # Requests I helped with
PUT    /api/requests/:id/mark-solved    # Mark as solved
```

### Helper Offer Endpoints
```
POST   /api/offers/request/:requestId/offer  # Offer help
GET    /api/offers/request/:requestId        # Get offers for request
GET    /api/offers/my-offers                 # Get my pending offers
PUT    /api/offers/:offerId/accept           # Accept offer
PUT    /api/offers/:offerId/reject           # Reject offer
```

### Message Endpoints
```
POST   /api/messages                    # Send message
GET    /api/messages/conversations      # Get conversations
GET    /api/messages/:userId            # Get messages with user
PUT    /api/messages/:id/read           # Mark as read
DELETE /api/messages/:id                # Delete message
```

### Notification Endpoints
```
GET    /api/notifications               # Get notifications
GET    /api/notifications/unread-count  # Get unread count
PUT    /api/notifications/:id/read      # Mark as read
PUT    /api/notifications/read/all      # Mark all as read
DELETE /api/notifications/:id           # Delete notification
DELETE /api/notifications               # Clear all
```

### Leaderboard Endpoints
```
GET    /api/leaderboard/top-helpers     # Get top helpers
GET    /api/leaderboard/user/:userId    # Get user rank
GET    /api/leaderboard/my-rank         # Get my rank
POST   /api/leaderboard/update          # Update rankings
```

## 🛡️ Middleware Stack

### 1. **Authentication Middleware**
- Verifies JWT tokens
- Handles token expiration
- Supports refresh token flow
- Attaches user to request

### 2. **Role-Based Access Control (RBAC)**
- `checkRole()`: Verify specific roles
- `canHelp()`: Only for helpers
- `isAdmin()`: Admin-only routes
- `checkOwnership()`: Resource ownership

### 3. **Validation Middleware**
- `validateBody()`: Validate request body (Yup)
- `validateParams()`: Validate URL params
- `validateQuery()`: Validate query strings
- Returns 400 with field errors

### 4. **Error Handler**
- Catches all errors
- Formats consistent error responses
- Handles Mongoose errors
- JWT errors with proper codes

### 5. **Logger Middleware**
- Logs all requests with duration
- Error logging with stack traces
- User ID tracking
- Performance metrics

### 6. **Rate Limiter**
- General: 100 requests/min per IP
- Auth: 5 attempts/min per IP
- Per-user: 30 requests/min
- Automatic unlocking after window

## 🧠 AI Features

### Auto-Categorization
Analyzes title + description to auto-assign category:
- academics, technical, career, health, lifestyle, creative, other

### Smart Tag Suggestions
Suggests up to 5 tags based on content:
- urgent, beginner, expert, free, paid

### AI Summaries
Generates 150-char summaries of long requests

### Relevance Scoring
Matches helpers to requests based on:
- Skill match (40%)
- Location (20%)
- Trust score (30%)
- Interest match (10%)

## 🗄️ Database Models

### User
```javascript
{
  name, email, password,
  role: "need_help" | "can_help" | "both",
  bio, skills[], interests[], location, avatar,
  trustScore, helpCount, requestCount, badges[],
  refreshTokens[], createdRequests[], helpedRequests[],
  timestamps
}
```

### Request
```javascript
{
  title, description, category, tags[], urgency,
  autoCategory, suggestedTags[], aiSummary,
  status: "open" | "in_progress" | "solved" | "closed",
  createdBy, acceptedHelper, solvedBy,
  helpOffers[], requiredSkills[], helperLocation,
  views, rating, timestamps
}
```

### HelperOffer
```javascript
{
  requestId, userId, message,
  status: "pending" | "accepted" | "rejected" | "completed",
  rating, feedback, timestamps
}
```

### Message
```javascript
{
  senderId, receiverId, requestId,
  content, attachments[],
  status: "sent" | "delivered" | "read",
  readAt, deliveredAt, timestamps
}
```

### Notification
```javascript
{
  userId, type, title, message,
  relatedUserId, relatedRequestId, relatedOfferId,
  read, readAt, expiresAt, timestamps
}
```

### Leaderboard
```javascript
{
  userId,
  allTimeRank, monthlyRank, weeklyRank,
  totalHelped, monthlyHelped, weeklyHelped,
  trustScore, averageRating, completionRate,
  badges[], lastUpdated
}
```

## 🔍 Error Handling

All responses follow a consistent format:

**Success:**
```json
{
  "success": true,
  "message": "Request created successfully",
  "statusCode": 201,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Validation failed",
  "statusCode": 400,
  "errors": {
    "title": "Title must be at least 10 characters"
  }
}
```

## 📊 Request Filters

### Get All Requests
```bash
GET /api/requests?category=technical&urgency=high&status=open&page=1&limit=10
```

Query Parameters:
- `category`: academics, technical, career, health, lifestyle, creative, other
- `urgency`: low, medium, high, critical
- `status`: open, in_progress, solved, closed
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 50)
- `sort`: Sort field (default: -createdAt)

## 🔐 Security Best Practices

✅ Password hashing with bcryptjs (salt rounds: 10)
✅ JWT tokens with short expiry (15 min access)
✅ HTTP-only cookies for token storage
✅ CORS configuration per environment
✅ Rate limiting on all endpoints
✅ Input validation with Yup schemas
✅ MongoDB injection prevention
✅ Error message sanitization

## 🚢 Deployment

### Vercel
```bash
# Already configured in vercel.json
npm install -g vercel
vercel
```

### Environment Variables on Vercel
- `MONGO_URI`
- `JWT_SECRET`
- `REFRESH_TOKEN_SECRET`
- `FRONTEND_URL`
- `NODE_ENV=production`

### Health Check
```bash
curl http://your-backend.vercel.app/
# Response: { success: true, message: "Helplytics AI Backend is running" }
```

## 📝 API Usage Examples

### Register
```bash
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123",
    "confirmPassword": "SecurePass123",
    "role": "both"
  }'
```

### Create Request
```bash
curl -X POST http://localhost:5000/api/requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -d '{
    "title": "Need help with React hooks",
    "description": "I am struggling with useEffect...",
    "category": "technical",
    "urgency": "high",
    "tags": ["react", "javascript"]
  }'
```

### Offer Help
```bash
curl -X POST http://localhost:5000/api/offers/request/REQUEST_ID/offer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -d '{
    "message": "I have 5 years of React experience and would love to help!"
  }'
```

## 🐛 Troubleshooting

### "Cannot find module" errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### MongoDB connection issues
- Check `MONGO_URI` in `.env`
- Ensure MongoDB service is running
- Verify network access for MongoDB Atlas

### Token expiry issues
- Make sure `JWT_SECRET` matches client-side verification
- Check refresh token expiry (should be longer than access)

### CORS errors
- Update `FRONTEND_URL` in `.env`
- Ensure `credentials: true` is set

## 📈 Performance Tips

- Use MongoDB indexes (already configured)
- Pagination on large result sets
- Cache leaderboard rankings
- Compress responses with gzip
- Use CDN for file uploads
- Monitor request logs

## 🎯 Next Steps

1. **Frontend Integration**: Connect React frontend to these APIs
2. **Real-time Features**: Add Socket.io for live messaging/notifications
3. **File Uploads**: Integrate AWS S3 or Cloudinary
4. **Email Notifications**: Configure Nodemailer
5. **Analytics**: Add analytics tracking
6. **Admin Dashboard**: Create admin panel
7. **Advanced AI**: Integrate OpenAI API for better suggestions

---

**Built with ❤️ for SMIT Grand Coding Night 2026**

Questions? Create an issue or reach out to the team!
