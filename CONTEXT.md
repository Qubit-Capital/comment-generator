# Project Context

## Project Overview
LinkedIn Comment Generator Chrome Extension that helps users generate contextually relevant comments on LinkedIn posts.

## Current State
- Version: 1.1.4
- Platform: Chrome Extension
- Main Integration: LinkedIn, Breakcold
- API: Relevance API (https://api-bcbe5a.stack.tryrelevance.com/latest/studios)
- Analytics: MongoDB-based event tracking and visualization

## Key Components

### 1. Content Scripts
- **linkedin-content.js** & **breakcold-content.js**: Platform-specific integrations
  - Enhanced post text extraction with multiple selectors
  - Improved UI with loading states and animations
  - Modal-based comment selection with regeneration
  - Smooth transitions and error handling
  - Event dispatching for analytics tracking
  - Custom event handling for modal actions

### 2. Analytics System
- **analytics-observer.js**: Core analytics tracking
  - Event tracking for comment generation and selection
  - Robust error handling and retry mechanism
  - Session storage management
  - Data validation and formatting
  - Event deduplication with compound indexes
  - Pending event management
  - Modal close action tracking

- **Event Types**:
  - Generation Events:
    ```javascript
    {
        eventId: uuid,
        postId: uuid,
        type: 'generation',
        platform: string,
        data: {
            sourcePost: {
                text: string,
                metrics: {
                    length: number,
                    sentiment: string,
                    keywords: string[]
                }
            },
            generatedComments: Array<{
                id: uuid,
                text: string,
                tone: string,
                index: number,
                metrics: {
                    length: number,
                    sentiment: string,
                    keywords: string[]
                }
            }>,
            closeReason: 'close_button' | 'outside_click' | null
        },
        metadata: {
            completionType: 'selection' | 'no_selection',
            timestamp: string,
            browserInfo: string
        }
    }
    ```
  - Selection Events:
    ```javascript
    {
        eventId: uuid,
        postId: uuid,
        type: 'selection',
        platform: string,
        data: {
            sourcePost: {...},
            selectedComment: {
                id: uuid,
                text: string,
                index: number,
                metrics: {...}
            },
            generatedComments: Array<...>
        },
        metadata: {
            completionType: 'selection',
            timestamp: string,
            browserInfo: string
        }
    }
    ```

### 3. MongoDB Schema
- **CommentEventSchema**: Core schema for tracking events
  ```javascript
  {
    data: {
      sourcePost: {
        text: String,       // Required
        metrics: {
          length: Number,   // Required, min: 0
          sentiment: String,// enum: ['positive', 'negative', 'neutral']
          keywords: [String]
        }
      },
      generatedComments: [...],
      selectedComment: {...}
    }
  }
  ```

### 4. Analytics Dashboard
- **analytics.html**: Main analytics interface
  - Real-time statistics display
  - Post samples visualization
  - Comment generation trends
  - Success rate tracking
  - Platform filtering
  - Time range selection
  - Post text analysis
  - Comment metrics visualization

### 5. UI Components
- Enhanced modal-based comment selection
- Loading spinners with platform-specific styling
- Regenerate button with loading state
- Close button for modal dismissal
- Analytics visualization dashboard
- Post samples display with metrics
- Type badges for different comment styles:
  - Friendly
  - Encouraging
  - Neutral
  - Positive
  - Curious
- Platform-specific styling
- Responsive design with smooth transitions

### 6. Error Handling
- Comprehensive error handling for:
  - API failures with retry mechanism
  - Analytics event processing
  - Data validation and formatting
  - Storage operations
  - Network connectivity issues
- Detailed error logging and reporting
- User-friendly error messages
- Fallback mechanisms for data recovery

## Best Practices
1. Always generate new event IDs for retry attempts
2. Properly stringify and validate all data before storage
3. Implement proper error handling with retries
4. Maintain detailed logging for debugging
5. Ensure data integrity in storage operations
6. Follow MongoDB best practices for event storage
7. Keep UI responsive during async operations

## Recent Updates
1. Added post text analytics display
2. Enhanced event tracking for modal actions
3. Improved analytics dashboard layout
4. Added event deduplication
5. Enhanced data structure for analytics

## Known Issues
- Need to handle dynamic content loading better
- Could improve error recovery
- Mobile responsiveness needs testing
- Analytics dashboard needs polishing

## Next Steps
1. Implement comment regeneration analytics
2. Add more detailed post analysis
3. Enhance mobile responsiveness
4. Add export functionality for analytics
5. Implement user preferences storage

## Testing Priorities
1. Verify post text capture
2. Test modal close actions
3. Check analytics data accuracy
4. Validate mobile display
5. Test dashboard performance

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

## Important Files
- manifest.json: Extension configuration
- linkedin-content.js: Main LinkedIn integration
- analytics-observer.js: Core analytics tracking
- CHANGELOG.md: Detailed change history

## Dependencies
- LinkedIn's Quill editor
- Relevance API
- Chrome Extension APIs
- MongoDB for analytics event storage

## Security Considerations
1. Handle API keys securely
2. Respect LinkedIn's CSP
3. Validate API responses
4. Clean up sensitive data
5. Implement secure analytics event storage
