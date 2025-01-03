# Comment Generator Extension

A browser extension that generates contextual comments for LinkedIn and BreakCold platforms with analytics tracking.

## Features

- Contextual comment generation based on post content
- Platform-specific comment styles and tones
- Analytics tracking for comment generation and usage
- Comment regeneration with history tracking
- Clean and intuitive user interface

## Technical Architecture

### Frontend
- Chrome Extension content scripts for LinkedIn and BreakCold
- Modal-based UI for comment generation and selection
- Real-time analytics tracking

### Backend
- MongoDB for analytics storage
- Platform-specific analytics models
- Event-based architecture for tracking
- WebSocket support for real-time updates

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Set up MongoDB and configure connection string in `.env`
4. Start the analytics server:
```bash
npm run start-analytics
```
5. Load the extension in Chrome:
   - Open `chrome://extensions/`
   - Enable Developer mode
   - Click "Load unpacked"
   - Select the extension directory

## Development

### Project Structure
```
├── content/
│   ├── linkedin/         # LinkedIn-specific content scripts
│   └── breakcold/        # BreakCold-specific content scripts
├── db/
│   ├── schemas/          # MongoDB schemas
│   └── operations/       # Database operations
├── models/              # Data models
├── shared/             # Shared utilities
└── analytics/          # Analytics tracking
```

### Testing
```bash
npm test
```

### Building
```bash
npm run build
```

## Analytics Features

- Comment generation tracking
- Comment selection analytics
- Regeneration history
- Platform-specific metrics
- Real-time data updates

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details
