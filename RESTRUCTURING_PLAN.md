# Project Restructuring Plan

## Overview
This document outlines the plan to restructure the Comment Generator project by separating the server and extension components. The main goal is to create a clear separation of concerns between the Chrome extension and the backend server, enabling better maintainability and scalability.

## New Project Structure
```
comment-generator/
├── extension/               # Chrome extension code
│   ├── manifest.json
│   ├── background/
│   ├── content/
│   │   ├── linkedin/
│   │   ├── breakcold/
│   │   └── shared/
│   ├── popup/
│   └── utils/
│
├── server/                  # Separate server application
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utility functions
│   │   └── app.js         # Express application
│   ├── package.json
│   └── .env
│
└── shared/                  # Shared code between extension and server
    └── types/              # Type definitions and constants
```

## Implementation Phases

### Phase 1: Server Setup
1. Create server directory structure
2. Set up new Express application
3. Migrate existing server code:
   - Move analytics endpoints
   - Move database models
   - Set up proper middleware
4. Implement API endpoints:
   - `/api/analytics` - Analytics data
   - `/api/events` - Event tracking
   - `/api/platforms` - Platform operations
5. Set up database connection handling
6. Add proper error handling and logging

### Phase 2: Extension Refactor
1. Remove server code from extension
2. Implement HTTP client:
   - Add axios for API communication
   - Implement retry logic
   - Add error handling
3. Update content scripts:
   - Modify event tracking
   - Add offline support
   - Implement proper error handling
4. Update manifest.json for new permissions

### Phase 3: Communication Protocol
1. API Contracts:
   - Standard request/response formats
   - Error response structure
   - Authentication headers
2. Security Implementation:
   - API key authentication
   - Rate limiting
   - Request validation
3. CORS Configuration

### Phase 4: Testing & Integration
1. Server-side tests:
   - API endpoint tests
   - Database operation tests
   - Integration tests
2. Extension tests:
   - Offline functionality
   - API communication
   - Event tracking
3. Performance testing
4. Security testing

### Phase 5: Deployment
1. Server deployment setup
2. Environment configuration
3. Monitoring and logging setup
4. Documentation updates

## Configuration Details

### Server Environment Variables
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/analytics
API_KEY_SECRET=your-secret-key
NODE_ENV=development
```

### Extension Environment Variables
```
API_ENDPOINT=http://localhost:3000
API_KEY=your-api-key
ENV=development
```

## Development Setup

### Server Scripts
```json
{
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js",
    "test": "jest",
    "lint": "eslint src/"
  }
}
```

### Extension Scripts
```json
{
  "scripts": {
    "build": "webpack --mode production",
    "dev": "webpack --mode development --watch",
    "test": "jest",
    "lint": "eslint extension/"
  }
}
```

## Security Considerations
1. API Authentication:
   - API key validation
   - Request signing
   - Token-based auth for specific endpoints
2. Rate Limiting:
   - Per-endpoint limits
   - User-based quotas
3. Data Validation:
   - Input sanitization
   - Schema validation
4. CORS Security:
   - Whitelist allowed origins
   - Proper header configuration

## Migration Strategy
1. Create new server structure
2. Implement core server functionality
3. Create new API endpoints
4. Update extension gradually:
   - One feature at a time
   - Maintain backward compatibility
5. Test thoroughly
6. Deploy server
7. Release updated extension

## Timeline
- Phase 1 (Server Setup): 1 week
- Phase 2 (Extension Refactor): 1 week
- Phase 3 (Communication Protocol): 3 days
- Phase 4 (Testing & Integration): 4 days
- Phase 5 (Deployment): 2 days

Total estimated time: 3.5 weeks
