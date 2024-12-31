# Project Context

## Project Overview
LinkedIn Comment Generator Chrome Extension that helps users generate contextually relevant comments on LinkedIn posts.

## Current State
- Version: 1.0.1
- Platform: Chrome Extension
- Main Integration: LinkedIn
- API: Relevance API (https://api-bcbe5a.stack.tryrelevance.com/latest/studios)

## Key Components

### 1. Content Scripts
- **linkedin-content.js**: Main content script for LinkedIn integration
  - Handles post text extraction
  - Manages comment generation UI
  - Integrates with LinkedIn's Quill editor
  - Implements modal display and interaction

### 2. API Integration
- Direct API calls without shared library
- Request Structure:
```javascript
{
    params: {
        linked_in_post: postText
    },
    project: projectId
}
```
- Implements retry mechanism with exponential backoff
- Handles markdown-wrapped JSON responses

### 3. UI Components
- Modal-based comment selection
- Type badges for different comment styles:
  - Friendly
  - Encouraging
  - Neutral
  - Positive
  - Curious
- LinkedIn-styled interface
- Responsive design

### 4. Text Extraction
- Uses specific LinkedIn selectors:
```javascript
'.feed-shared-update-v2__description-wrapper',
'.feed-shared-update-v2__commentary',
'.feed-shared-text-view span[dir="ltr"]',
'.feed-shared-text',
'.update-components-text'
```
- Filters unwanted elements
- Handles different post types

## Recent Changes
1. Fixed modal display issues
2. Improved API integration
3. Enhanced text extraction
4. Added type badges
5. Improved error handling

## Known Issues
- Need to handle dynamic content loading better
- Could improve error recovery
- Mobile responsiveness needs testing

## Next Steps
1. Improve Breakcold integration
2. Add more comment types
3. Enhance error handling
4. Improve mobile support
5. Add analytics

## Technical Details

### DOM Structure
The extension interacts with LinkedIn's DOM structure:
- Post content is nested in feed-shared components
- Comments use Quill editor
- Dynamic content loading needs observation

### API Flow
1. Extract post text
2. Send to Relevance API
3. Parse markdown-wrapped JSON response
4. Display formatted comments in modal
5. Handle selection and insertion

### Error Handling
- Comprehensive error messages
- User-friendly notifications
- Detailed logging
- Retry mechanisms

## Development Guidelines
1. Match LinkedIn's design language
2. Maintain responsive design
3. Handle errors gracefully
4. Log important operations
5. Clean up resources properly

## Testing Requirements
1. Test on different post types
2. Verify API integration
3. Check error scenarios
4. Validate mobile display
5. Test performance

## Important Files
- manifest.json: Extension configuration
- linkedin-content.js: Main LinkedIn integration
- CHANGELOG.md: Detailed change history

## Dependencies
- LinkedIn's Quill editor
- Relevance API
- Chrome Extension APIs

## Security Considerations
1. Handle API keys securely
2. Respect LinkedIn's CSP
3. Validate API responses
4. Clean up sensitive data

This context file provides all necessary information to continue development in a new thread.
