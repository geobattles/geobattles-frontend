// Preserve existing service autoimports for compatibility; callers import services explicitly.
// Composables and pure utilities are discovered directly in their standard app directories.
export { createAuthService } from "~/services/authService";
export { createLobbyService } from "~/services/lobbyService";
