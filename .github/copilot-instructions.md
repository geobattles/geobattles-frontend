# GitHub Copilot Instructions for GeoBattles

## Project Context

GeoBattles is a geography-based educational game where players compete by identifying locations on a map. It is a multiplayer game. Each client is connected to the server via
websocket. All in game communications go through websockets.

## Technologies

- Nuxt 3 for the frontend framework
- TypeScript for type-safe code
- PrimeVue V4 for UI components
- Tailwind CSS for styling
- Pinia for state management
- WebSockets for real-time communication

## Code Style Guidelines

- Use TypeScript for all new code
- Follow functional programming patterns where possible
- Use descriptive variable names that reflect their purpose
- Include JSDoc comments for all functions and classes
- Use async/await instead of raw Promises when handling asynchronous code

## Architecture Preferences

- Follow component-based architecture for frontend code
- Implement state management using Pinia stores
- Keep components small and focused on a single responsibility

## Error Handling

- Always include comprehensive error handling in all async functions
- Use meaningful error messages that help debugging
- Log errors appropriately before handling them

## Dependencies

- Prefer native solutions over adding new dependencies
- Suggest lightweight alternatives to heavy libraries
- Consider bundle size impact when suggesting new dependencies
