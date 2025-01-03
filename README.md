# AI Comment Generator

## Version 2.1.0

A powerful browser extension that helps users generate contextually relevant comments for LinkedIn posts and BreakCold platform.

## Features

### Core Features
- AI-powered comment generation based on post content
- Multiple comment styles/tones (Friendly, Professional, Humorous, etc.)
- Comment regeneration with type persistence
- Seamless integration with LinkedIn and BreakCold platforms

### Enhanced Functionality
- Smart comment type detection and preservation
- Smooth animations and transitions
- Improved error handling and user feedback
- Background analytics tracking

## Technical Architecture

### Frontend
- Vanilla JavaScript for core functionality
- Custom CSS for styling and animations
- Event-driven architecture for UI interactions

### Backend Integration
- RESTful API integration for comment generation
- MongoDB for analytics storage
- Session storage for state management

### Analytics
- Background tracking of comment generation and usage
- Performance monitoring
- User interaction analysis

## Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Build the extension: `npm run build`
4. Load the extension in Chrome:
   - Open chrome://extensions/
   - Enable Developer mode
   - Click "Load unpacked"
   - Select the `dist` folder

## Development

### Setup
```bash
git clone <repository-url>
cd comment-generator
npm install
```

### Running Tests
```bash
npm test
```

### Building
```bash
npm run build
```

### Branch Strategy
- `main`: Production-ready code
- `v2.x`: Feature development branches
- `hotfix/*`: Bug fix branches

## Contributing
1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License
This project is licensed under the MIT License - see the LICENSE file for details.
