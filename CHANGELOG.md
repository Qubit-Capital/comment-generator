# Changelog

All notable changes to the Comment Generator Extension will be documented in this file.

## [Unreleased]

## [1.1.4] - 2025-01-02

### Fixed
- Added missing sourcePost field to CommentEventSchema in MongoDB
  - Added proper validation for post text and metrics
  - Fixed data persistence for post content
  - Added schema validation for sentiment values
  - Improved data structure for post metrics

### Changed
- Enhanced MongoDB schema validation
  - Added required fields for post data
  - Added enum validation for sentiment values
  - Added minimum value validation for metrics

## [1.1.3] - 2025-01-02

### Added
- Post text analytics display
  - Added post samples section to analytics dashboard
  - Included post metrics (length, sentiment, keywords)
  - Added post generation and selection statistics
  - Enhanced MongoDB queries to include post data

### Changed
- Improved analytics dashboard layout
  - Added responsive design for post samples
  - Enhanced stats card layout
  - Updated success rate calculation
  - Added refresh button

## [1.1.2] - 2025-01-02

### Added
- Enhanced analytics event tracking
  - Added tracking for popup close actions (close button and outside clicks)
  - Implemented event deduplication using compound indexes
  - Added completion type tracking ('selection' vs 'no_selection')
  - Added close reason tracking for non-selection cases

### Changed
- Improved analytics data structure
  - Consolidated generation and selection events into single events
  - Enhanced event schema with new fields for close actions
  - Added proper cleanup of pending events
  - Improved session storage management

### Fixed
- Fixed duplicate analytics events issue
  - Implemented proper event handling for modal close actions
  - Added proper event cleanup after processing
  - Fixed missing data in non-selection events
  - Resolved multiple event generation for single actions

## [1.1.1] - 2025-01-02

### Fixed
- Fixed analytics data handling issues
  - Resolved "[object Object]" text appearing in comment data by properly stringifying comment objects
  - Fixed MongoDB duplicate key errors by generating new event IDs for retry attempts
  - Added proper type checking and string conversion for comment data
  - Improved error handling for sessionStorage operations
- Enhanced error handling and logging
  - Added detailed logging for server communication attempts
  - Added retry delay information in logs
  - Added better error context in analytics events

### Changed
- Improved analytics observer robustness
  - Added array type checking for comments
  - Enhanced comment text extraction from objects
  - Added fallback to JSON.stringify for complex objects
  - Improved session storage error handling
- Enhanced retry mechanism
  - Added new event ID generation for each retry attempt
  - Improved exponential backoff logging
  - Added better error context for failed attempts

## [1.1.0] - 2025-01-01

### Added
- Analytics system implementation
  - Added analytics tracking for comment generation and usage
  - Created analytics observer to track and store events
  - Implemented analytics page with stats and timeline view
  - Added platform and time range filtering
- Analytics UI components
  - Added analytics button to comment modals
  - Created modern analytics dashboard design
  - Implemented event timeline with color-coded cards
  - Added filtering controls for better data analysis

### Changed
- Updated content scripts to track analytics events
- Modified modal structure to include analytics button
- Enhanced error handling and logging
- Updated manifest to include analytics-related files
- Improved loading state management in modals

## [1.0.2] - 2024-12-31

### Added
- **Enhanced UI Components**
  - Added aesthetic loading spinners for both Breakcold and LinkedIn
  - Implemented "Use this Comment" button for each generated comment
  - Added "Regenerate Comments" button with loading state
  - Added close button to dismiss comment generation modal
  - Added hover effects and transitions for better interactivity

### Fixed
- **LinkedIn Comment Generation**
  - Fixed text extraction from LinkedIn posts by implementing comprehensive selector strategy
  - Added support for multiple post content selectors:
    - `.feed-shared-update-v2__description`
    - `.feed-shared-text-view`
    - `.feed-shared-inline-show-more-text`
    - `.feed-shared-update__description`
    - `.update-components-text`
  - Improved post container detection reliability
  - Fixed button injection in LinkedIn comment fields

### Improved
- **User Experience**
  - Enhanced loading state visibility with centered, animated spinners
  - Improved error message display and formatting
  - Added smooth transitions for modal and loader states
  - Better visual feedback for comment selection and regeneration

## [1.0.1] - 2024-12-31

### Fixed
- **LinkedIn Comment Display**
  - Fixed modal not appearing after comment generation
  - Resolved issue with [object Object] being displayed instead of actual comments
  - Fixed modal z-index to ensure it appears above LinkedIn content
  - Corrected modal positioning and overlay behavior

- **API Integration**
  - Fixed authentication issues with the Relevance API
  - Corrected request format to match API expectations
  - Fixed response parsing for markdown-wrapped JSON
  - Added proper error handling for API failures
  - Implemented retry mechanism with exponential backoff (3 retries max)

- **Text Extraction**
  - Fixed issue with extracting alt text instead of post content
  - Corrected selector priority for LinkedIn post content
  - Added filtering for unwanted UI elements and interactive content
  - Fixed handling of different post types (articles, documents, polls)

### Added
- **Comment Type System**
  - Added visual badges for comment types:
    - Friendly
    - Encouraging
    - Neutral
    - Positive
    - Curious
  - Color-coded badges for better visual hierarchy
  - Type-specific styling and formatting

- **Error Handling**
  - Added comprehensive error messages for:
    - API connection failures
    - Authentication issues
    - Content extraction problems
    - Invalid response formats
  - User-friendly error notifications
  - Detailed error logging for debugging

- **Logging System**
  - Added detailed logging for:
    - API requests and responses
    - Text extraction steps
    - Comment generation process
    - UI interactions
    - Error states
  - Debug mode toggle for development

### Changed
- **Post Text Extraction**
  - Updated selector list for better content targeting:
    ```javascript
    '.feed-shared-update-v2__description-wrapper',
    '.feed-shared-update-v2__commentary',
    '.feed-shared-text-view span[dir="ltr"]',
    '.feed-shared-text',
    '.update-components-text'
    ```
  - Improved content filtering logic
  - Better handling of dynamic content loading
  - Added retry mechanism for content extraction

- **Comment Display UI**
  - Redesigned comment options layout
  - Added hover effects for better interactivity
  - Improved typography and readability
  - Enhanced spacing and visual hierarchy
  - Added smooth transitions and animations

- **API Integration**
  - Switched to direct API calls without shared library
  - Updated request structure:
    ```javascript
    {
        params: {
            linked_in_post: postText
        },
        project: projectId
    }
    ```
  - Improved response handling and validation
  - Added request timeout handling

### Technical Changes
- **API Architecture**
  - Removed dependency on shared API.js
  - Implemented standalone API client
  - Added request queue management
  - Improved error recovery

- **DOM Manipulation**
  - Enhanced element selection strategy
  - Added mutation observer for dynamic content
  - Improved event delegation
  - Better cleanup of temporary elements

- **Performance**
  - Optimized selector queries
  - Reduced unnecessary DOM updates
  - Improved modal rendering performance
  - Added resource cleanup

### UI/UX Improvements
- **Modal Design**
  - Updated to match LinkedIn's design language
  - Added responsive layout
  - Improved mobile support
  - Enhanced accessibility

- **Visual Feedback**
  - Added loading spinners
  - Improved button states
  - Enhanced error visualizations
  - Better success indicators

- **Interaction Design**
  - Smoother transitions
  - Better keyboard navigation
  - Improved focus management
  - Enhanced touch support

### Code Quality
- **Error Handling**
  - Added try-catch blocks in critical sections
  - Improved error propagation
  - Better error recovery
  - Added error boundary concept

- **Logging**
  - Added structured logging
  - Improved debug information
  - Added performance metrics
  - Better error tracking

- **Code Organization**
  - Separated concerns
  - Improved function modularity
  - Better state management
  - Enhanced code documentation

## [1.0.0] - Initial Release

### Features
- **Platform Support**
  - LinkedIn integration
  - Breakcold platform support
  - Cross-platform compatibility

- **Core Functionality**
  - Comment generation
  - Post text extraction
  - Comment selection interface
  - Basic error handling

- **User Interface**
  - Modal-based comment selection
  - Basic styling
  - Platform-specific adaptations
  - Simple user feedback

### Notes
- Initial release focusing on core functionality
- Basic platform support
- Foundation for future improvements
