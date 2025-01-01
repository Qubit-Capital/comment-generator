# Changelog

All notable changes to the Comment Generator Extension will be documented in this file.

## [Unreleased]

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

### Fixed
- Fixed loading spinner visibility in LinkedIn
- Fixed analytics button functionality in both platforms
- Fixed modal transitions and animations
- Improved error message display

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
