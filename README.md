# LinkedIn Comment Generator

A Chrome extension that helps users generate contextually relevant comments on LinkedIn posts using AI.

## Features

- Generates relevant comments based on post content
- Multiple comment styles (Friendly, Encouraging, Neutral, Positive, Curious)
- LinkedIn-styled interface
- Easy one-click comment generation
- Smart post content extraction

## Installation

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension directory

## Usage

1. Navigate to LinkedIn
2. Find a post you want to comment on
3. Click the "Generate Comment" button
4. Select from the AI-generated comment suggestions
5. The selected comment will be automatically inserted into the comment field

## Development

### Prerequisites
- Chrome browser
- Node.js and npm (for development)

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
- `shared/`: Shared utilities and API integration

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
