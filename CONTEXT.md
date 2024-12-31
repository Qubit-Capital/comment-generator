# Project Context

## Project Overview
LinkedIn Comment Generator Chrome Extension that helps users generate contextually relevant comments on LinkedIn posts.

## Current State
- Version: 1.0.2
- Platform: Chrome Extension
- Main Integration: LinkedIn, Breakcold
- API: Relevance API (https://api-bcbe5a.stack.tryrelevance.com/latest/studios)

## Key Components

### 1. Content Scripts
- **linkedin-content.js**: Main content script for LinkedIn integration
  - Enhanced post text extraction with multiple selectors
  - Improved UI with loading states and animations
  - Modal-based comment selection with regeneration
  - Smooth transitions and error handling

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
- Enhanced modal-based comment selection
- Loading spinners with platform-specific styling
- Regenerate button with loading state
- Close button for modal dismissal
- Type badges for different comment styles:
  - Friendly
  - Encouraging
  - Neutral
  - Positive
  - Curious
- LinkedIn-styled interface
- Responsive design with smooth transitions

### 4. Text Extraction
- Comprehensive LinkedIn selectors:
```javascript
'.feed-shared-update-v2__description',
'.feed-shared-text-view',
'.feed-shared-inline-show-more-text',
'.feed-shared-update__description',
'.update-components-text',
'.feed-shared-text',
'.feed-shared-article'
```
- Improved post container detection
- Enhanced error handling
- Support for various post types

## Recent Changes
1. Added aesthetic loading spinners
2. Implemented comment selection UI
3. Added regenerate functionality
4. Enhanced text extraction reliability
5. Improved error handling and user feedback

## Known Issues
- Need to handle dynamic content loading better
- Could improve error recovery
- Mobile responsiveness needs testing

## Next Steps
1. Further improve Breakcold integration
2. Add more comment types
3. Enhance mobile support
4. Add analytics
5. Implement user preferences

## Technical Details

### DOM Structure
The extension interacts with both LinkedIn and Breakcold DOM structures:
- LinkedIn: Uses feed-shared components and Quill editor
- Breakcold: Custom comment field integration
- Both: Dynamic content loading with mutation observers

### API Flow
1. Extract post text using platform-specific selectors
2. Show loading state with platform-styled spinner
3. Send to Relevance API
4. Parse markdown-wrapped JSON response
5. Display formatted comments in modal with selection options
6. Handle regeneration and insertion

### Error Handling
- Enhanced error messages with visual feedback
- User-friendly notifications
- Loading states for all async operations
- Detailed logging
- Retry mechanisms

## Development Guidelines
1. Match platform-specific design languages
2. Maintain responsive design
3. Handle errors gracefully with visual feedback
4. Implement smooth transitions
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
