# LinkedIn Comment Generator

A Chrome extension that helps users generate contextually relevant comments on LinkedIn and Breakcold posts using AI.

## Features

- Generates relevant comments based on post content
- Multiple comment styles (Friendly, Encouraging, Neutral, Positive, Curious)
- Enhanced UI with loading animations and smooth transitions
- Platform-specific styling (LinkedIn and Breakcold)
- Easy comment selection with "Use this Comment" buttons
- Comment regeneration capability
- Smart post content extraction with comprehensive selectors
- Elegant error handling with visual feedback
- Advanced analytics tracking
  - Comment generation and usage tracking
  - Event timeline visualization
  - Platform and time range filtering
  - Post text analysis and metrics
  - Success rate tracking
  - Real-time statistics
  - Post samples visualization

## Installation

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension directory

## Usage

1. Navigate to LinkedIn or Breakcold
2. Find a post you want to comment on
3. Click the "Generate Comment" button
4. Wait for the AI to generate comments (indicated by a loading spinner)
5. Choose from multiple AI-generated suggestions by clicking "Use this Comment"
6. Not satisfied? Click "Regenerate Comments" for new suggestions
7. The selected comment will be automatically inserted into the comment field
8. View analytics to track your comment generation and usage patterns

## Analytics Dashboard

The extension includes a comprehensive analytics dashboard that shows:
- Total generations and success rate
- Average response time and unique posts
- Comment generation trends
- Post samples with metrics (length, sentiment, keywords)
- Platform-specific statistics
- Time-based filtering options

## Development

### Prerequisites
- Chrome browser
- Node.js and npm (for development)
- MongoDB (for analytics storage)

### Setup
```bash
git clone https://github.com/Qubit-Capital/comment-generator.git
cd comment-generator
# Install dependencies if any
```

### Project Structure
- `manifest.json`: Extension configuration
- `content/`: Content scripts
  - `linkedin/`: LinkedIn-specific integration
  - `breakcold/`: Breakcold-specific integration
- `shared/`: Shared utilities and API integration
- `analytics/`: Analytics tracking and visualization
  - `analytics-observer.js`: Event tracking and storage
  - `analytics.js`: Analytics UI and visualization
  - `analytics.html`: Analytics dashboard
- `styles/`: CSS files for UI components
- `db/`: Database schemas and operations

### Key Components
1. **Content Scripts**: Handle platform-specific integrations and event dispatching
2. **UI Components**: Loading spinners, modals, and buttons
3. **Analytics System**: Event tracking, storage, and visualization
4. **Shared Utilities**: Common functions and styles

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Changelog
See [CHANGELOG.md](CHANGELOG.md) for details about changes and updates.
