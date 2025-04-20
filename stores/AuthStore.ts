import type { User } from "@/types/appTypes";
import { authService } from "@/composables/services/authService"; // Corrected import path

export const useAuthStore = defineStore("auth", () => {
    const isAuthenticated = ref(false);
    const authError = ref<string | null>(null);
    const isLoginDialog = ref(false);
    const isRefreshingToken = ref(false);

    /**
     * Saves the access token to a cookie.
     * @param {string} token - The access token.
     * @param {number} expire - The expiry timestamp (in seconds).
     */
    const saveAccessToken = (token: string, expire: number): void => {
        const maxAge = expire - Math.floor(Date.now() / 1000);
        // const maxAge = 10; //! Dev
        const accessTokenCookie = useCookie("access_token", {
            maxAge: maxAge > 0 ? maxAge : 0,
            sameSite: "lax",
            // secure: true, // Enable in production
            path: "/",
        });
        accessTokenCookie.value = token;
    };

    /**
     * Saves the refresh token to a cookie.
     * @param {string} token - The refresh token.
     * @param {number} expire - The expiry timestamp (in seconds).
     */
    const saveRefreshToken = (token: string, expire: number): void => {
        const maxAge = expire - Math.floor(Date.now() / 1000);
        // const maxAge = 1000; //! Dev
        const refreshTokenCookie = useCookie("refresh_token", {
            maxAge: maxAge > 0 ? maxAge : 0,
            sameSite: "lax",
            // secure: true, // Enable in production
            // httpOnly: true, // Recommended for refresh tokens
            path: "/",
        });
        refreshTokenCookie.value = token;
    };

    /**
     * Checks if a JWT token has expired using a buffer.
     * @param {string} token - The JWT token to check.
     * @returns {boolean} True if expired, false if valid or unable to parse.
     */
    const isTokenExpired = (token: string): boolean => {
        try {
            const tokenData = parseJwt(token);
            const bufferSeconds = 60; // Consider token expired 60s early
            if (!tokenData || !tokenData.exp) return true;
            return tokenData.exp - bufferSeconds < Math.floor(Date.now() / 1000);
        } catch (error) {
            console.error("Error checking token expiry:", error);
            return true; // Assume expired if parsing fails
        }
    };

    /**
     * Retrieves the raw access token from the cookie. Does not check expiry.
     * @returns {string | null} The access token or null if not found.
     */
    const getRawAccessToken = (): string | null => {
        const accessTokenCookie = useCookie("access_token");
        return accessTokenCookie.value || null;
    };

    /**
     * Retrieves the raw refresh token from the cookie. Does not check expiry.
     * @returns {string | null} The refresh token or null if not found.
     */
    const getRawRefreshToken = (): string | null => {
        const refreshTokenCookie = useCookie("refresh_token");
        return refreshTokenCookie.value || null;
    };

    /**
     * Clears both access and refresh tokens from cookies.
     */
    const clearTokens = (): void => {
        const accessTokenCookie = useCookie("access_token", { path: "/" });
        const refreshTokenCookie = useCookie("refresh_token", { path: "/" });
        accessTokenCookie.value = null;
        refreshTokenCookie.value = null;
        console.debug("Tokens cleared.");
    };

    /**
     * Parses the JWT access token and updates player info state.
     * @param {string} token - The access token string.
     * @throws {Error} If token is not defined or invalid.
     */
    const saveTokenData = (token: string): void => {
        if (!token) {
            console.error("Access Token is not available for saving data.");
            isAuthenticated.value = false;
            throw new Error("Access Token is not defined");
        }
        try {
            const tokenData = parseJwt(token);
            if (!tokenData) throw new Error("Invalid token data: Parsing returned null");

            const playerInfo = usePlayerInfo();
            playerInfo.value.username = tokenData.user_name || tokenData.username;
            playerInfo.value.ID = tokenData.sub || tokenData.uid;
            playerInfo.value.displayName = tokenData.display_name || tokenData.name;
            playerInfo.value.guest = tokenData.guest || false;
            isAuthenticated.value = true;
            authError.value = null;
        } catch (error) {
            console.error("Failed to parse JWT or save token data:", error);
            isAuthenticated.value = false;
            clearTokens();
            authError.value = "Invalid token data. Please log in again.";
            throw new Error("Invalid token data");
        }
    };

    /**
     * Checks if the player is currently marked as authenticated in the store state.
     * @returns {boolean} True if the isAuthenticated ref is true.
     */
    const isPlayerAuthenticated = (): boolean => {
        return isAuthenticated.value;
    };

    /**
     * Logs the player out, clearing tokens and resetting state.
     */
    const logout = (): void => {
        console.debug("Logging out user...");
        clearTokens();
        usePlayerInfo().value = {} as User;
        isAuthenticated.value = false;
        authError.value = null;
        const socketStore = useWebSocketStore();
        if (socketStore.isConnected) {
            socketStore.disconnect();
        }
        const router = useRouter();
        router.replace({ path: "/" });

        // Show login dialog after logout
        isLoginDialog.value = true;
    };

    /**
     * Attempts to refresh the access token using the refresh token.
     * Handles locking to prevent concurrent refreshes.
     * @returns {Promise<string | null>} The new access token if successful, otherwise null.
     */
    const refreshToken = async (): Promise<string | null> => {
        // Prevent concurrent refresh attempts
        if (isRefreshingToken.value) {
            console.debug("Token refresh already in progress. Waiting...");
            // Check periodically if refresh is done
            await new Promise((resolve) => setTimeout(resolve, 500)); // Wait 500ms
            // After waiting, check if authentication is now valid, return token if so
            return isAuthenticated.value ? getRawAccessToken() : null;
        }

        const currentRefreshToken = getRawRefreshToken();
        if (!currentRefreshToken) {
            console.error("Refresh failed: No refresh token found.");
            if (isAuthenticated.value) logout(); // Logout if we thought we were logged in
            return null;
        }

        // Optional: Check refresh token expiry locally first
        if (isTokenExpired(currentRefreshToken)) {
            console.error("Refresh failed: Refresh token has expired.");
            logout(); // Expired refresh token requires re-login
            return null;
        }

        isRefreshingToken.value = true;
        authError.value = null;
        console.debug("Attempting to refresh token...");

        try {
            const responseData = await authService.refreshAccessToken(currentRefreshToken);
            saveAccessToken(responseData.AccessToken, responseData.AccessExpiry);
            saveRefreshToken(responseData.RefreshToken, responseData.RefreshExpiry);
            saveTokenData(responseData.AccessToken); // Save data from the *new* access token
            console.debug("Token refreshed successfully.");
            return responseData.AccessToken;
        } catch (error: any) {
            console.error("Token refresh failed:", error);
            authError.value = "Your session has expired. Please log in again.";
            logout(); // Critical failure: clear tokens and force re-login
            return null;
        } finally {
            isRefreshingToken.value = false; // Ensure flag is reset
        }
    };

    /**
     * Ensures a valid (non-expired) access token is available, refreshing if necessary.
     * This should be called before making requests to protected API endpoints.
     * @returns {Promise<string | null>} The valid access token, or null if unable to get one.
     */
    const getValidAccessToken = async (): Promise<string | null> => {
        const currentAccessToken = getRawAccessToken();

        if (currentAccessToken && !isTokenExpired(currentAccessToken)) {
            // Current token exists and is not expired (within buffer)
            return currentAccessToken;
        }

        console.log("Access token missing or expired. Attempting refresh...");
        // If token is missing or expired, attempt to refresh
        return await refreshToken();
    };

    /**
     * Logs in a user.
     * @param {string} username - The username.
     * @param {string} password - The password.
     * @returns {Promise<void>}
     * @throws {Error} If login fails.
     */
    const login = async (username: string, password: string): Promise<void> => {
        try {
            authError.value = null;
            const responseData = await authService.login(username, password);
            saveAccessToken(responseData.AccessToken, responseData.AccessExpiry);
            saveRefreshToken(responseData.RefreshToken, responseData.RefreshExpiry);
            saveTokenData(responseData.AccessToken); // Save data from the new access token
            console.debug("Login successful.");
        } catch (error: any) {
            console.error("Login failed:", error);
            isAuthenticated.value = false;
            authError.value = error.message || "Login failed. Please check your credentials.";
            clearTokens();
            throw error;
        }
    };

    /**
     * Registers a new user.
     * @param {string} username - The username.
     * @param {string} password - The password.
     * @param {string} displayName - The display name.
     * @returns {Promise<void>}
     * @throws {Error} If registration fails.
     */
    const register = async (username: string | null, password: string | null, displayName: string | null): Promise<void> => {
        try {
            authError.value = null;
            const responseData = await authService.register(username, password, displayName);
            saveAccessToken(responseData.AccessToken, responseData.AccessExpiry);
            saveRefreshToken(responseData.RefreshToken, responseData.RefreshExpiry);
            saveTokenData(responseData.AccessToken); // Use AccessToken here
            console.debug("Registration successful.");
        } catch (error: any) {
            console.error("Registration failed:", error);
            isAuthenticated.value = false;
            authError.value = error.message || "Registration failed. Please try again.";
            clearTokens();
            throw error;
        }
    };

    /**
     * Updates user profile information (display name and/or password).
     * @param {string | null} displayName - The new display name (null if not updating).
     * @param {string | null} password - The new password (null if not updating).
     * @returns {Promise<void>}
     * @throws {Error} If update fails.
     */
    const updateUser = async (displayName: string | null, password: string | null): Promise<void> => {
        try {
            authError.value = null;

            // Get a valid access token
            const accessToken = await getValidAccessToken();
            // const accessToken = getRawRefreshToken();
            if (!accessToken) {
                throw new Error("Authentication required. Please log in again.");
            }

            // Call service to update user
            const responseData = await authService.updateUser(displayName, password, accessToken);

            // Update the access token and refresh token if they are returned
            saveAccessToken(responseData.AccessToken, responseData.AccessExpiry);
            saveRefreshToken(responseData.RefreshToken, responseData.RefreshExpiry);
            saveTokenData(responseData.AccessToken);
        } catch (error: any) {
            console.error("Profile update failed:", error);
            authError.value = error.message || "Profile update failed. Please try again.";
            throw error;
        }
    };

    /**
     * Initializes the auth state from cookies on app load.
     * Attempts to refresh the token if the access token is expired but a refresh token exists.
     * @returns {Promise<void>}
     */
    const initializeAuth = async (): Promise<void> => {
        console.log("Initializing authentication state...");
        const accessToken = getRawAccessToken();
        const refreshTokenVal = getRawRefreshToken();

        if (accessToken && !isTokenExpired(accessToken)) {
            console.debug("Valid access token found. Initializing user data.");
            try {
                saveTokenData(accessToken);
            } catch (error) {
                console.error("Initialization failed: Error saving token data.", error);
                logout();
            }
        } else if (refreshTokenVal && !isTokenExpired(refreshTokenVal)) {
            console.debug("Access token missing or expired, attempting refresh...");
            try {
                await refreshToken(); // Attempt refresh, state updated internally
            } catch (error) {
                console.error("Initialization failed: Refresh token attempt failed.", error);
                logout(); // Critical failure: clear tokens and force re-login
            }
        } else {
            console.debug("No valid tokens found or refresh token expired. User is logged out.");
            if (isAuthenticated.value || accessToken || refreshTokenVal) {
                logout(); // Logout and clear tokens
            } else {
                isAuthenticated.value = false;
                usePlayerInfo().value = {} as User;
                authError.value = null;
            }
        }
    };

    return {
        isAuthenticated, // Direct state ref
        authError, // Direct state ref
        isLoginDialog, // Direct state ref
        isRefreshingToken, // Expose the refreshing flag

        // Core actions
        login,
        register,
        logout,
        refreshToken, // Expose manual refresh if needed
        initializeAuth, // Expose initialization function
        getValidAccessToken, // <-- New function to get token and refresh if needed
        updateUser, // <-- New function to update user profile

        // State checkers/helpers
        isPlayerAuthenticated, // Function based on isAuthenticated ref
        isTokenExpired, // Utility function
    };
});
