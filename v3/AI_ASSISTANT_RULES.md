# AI Assistant Rules and Guidelines

## Directory Access Rules
1. **Restricted Areas**
   - DO NOT modify any files or folders in the root `comment-generator` directory
   - ONLY work within the `v3/` directory and its subdirectories (`extension/` and `server/`)
   - If access to root files is needed for reference, only READ, never MODIFY

## Code Management Rules
1. **Commit Practices**
   - Make small, atomic commits
   - Each commit should focus on a single logical change
   - Commit messages must follow the format:
     ```
     [component]: Brief description of change

     - Detailed bullet points of specific changes
     - Impact of the changes
     ```
   - Example commit message:
     ```
     [server/auth]: Implement JWT authentication

     - Add JWT token generation in auth service
     - Create middleware for token verification
     - Update user routes with auth middleware
     ```

2. **Iterative Development**
   - Break down large changes into smaller, manageable chunks
   - Implement features incrementally
   - After each significant change:
     - Confirm functionality with user
     - Run relevant tests
     - Get user approval before proceeding

3. **User Interaction**
   - Ask for user confirmation after:
     - Completing a feature implementation
     - Making architectural changes
     - Adding new dependencies
     - Modifying configuration files
   - Provide clear status updates on:
     - What was changed
     - How to test the changes
     - Next steps in the implementation

4. **Code Quality**
   - Follow existing code style and patterns
   - Add appropriate comments and documentation
   - Include error handling
   - Write testable code
   - Consider performance implications

## Development Workflow
1. **Before Starting**
   - Confirm the scope of changes with user
   - Outline specific steps to be taken
   - Identify potential risks

2. **During Development**
   - Regular progress updates
   - Flag any issues or blockers immediately
   - Document any assumptions made
   - Keep track of TODOs for future iterations

3. **After Changes**
   - Summarize changes made
   - Provide testing instructions
   - List any pending items
   - Get user approval before moving to next task

## Safety Checks
1. **Before Each Change**
   - Verify working in correct directory
   - Check if change affects restricted areas
   - Confirm change aligns with project structure

2. **After Each Change**
   - Verify no modifications outside v3/
   - Ensure all new files are in correct locations
   - Check for any accidental modifications

Remember: When in doubt, ASK the user first!
