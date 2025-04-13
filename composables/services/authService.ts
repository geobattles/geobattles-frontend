interface AuthResponse {
    AccessToken: string;
    RefreshToken: string;
    AccessExpiry: number;
    RefreshExpiry: number;
}

export const authService = {
    /**
     * Authenticates a user with username and password.
     * @param {string} username - The user's username.
     * @param {string} password - The user's password.
     * @returns {Promise<AuthResponse>} The authentication tokens and expiry times.
     * @throws {Error} If login fails.
     */
    async login(username: string, password: string): Promise<AuthResponse> {
        const endpoint = useAppStore().backendEndpoint;

        try {
            const response = await fetch(`${endpoint}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    // Handle cases where the error response is not valid JSON
                    throw new Error(`Login failed with status: ${response.status}`);
                }
                console.error("Login API error:", errorData);
                throw new Error(errorData?.error || `Login failed with status: ${response.status}`);
            }

            return await response.json();
        } catch (error: any) {
            console.error("Login service error:", error);
            // Re-throw the error to be handled by the caller (e.g., authStore) and ensure it's always an Error object
            throw error instanceof Error ? error : new Error("An unexpected error occurred during login.");
        }
    },

    /**
     * Registers a new user or guest.
     * @param {string | null} username - The username (null for guest).
     * @param {string | null} password - The password (null for guest).
     * @param {string | null} displayName - The display name.
     * @returns {Promise<AuthResponse>} The authentication tokens and expiry times.
     * @throws {Error} If registration fails.
     */
    async register(username: string | null, password: string | null, displayName: string | null): Promise<AuthResponse> {
        const baseEndpoint = useAppStore().backendEndpoint;
        const isRegularUser = username && password;
        // Ensure endpoint paths match your backend API routes exactly
        const endpoint = isRegularUser ? `${baseEndpoint}/auth/register/user` : `${baseEndpoint}/auth/register/guest`;
        const body = isRegularUser ? { username, password, displayname: displayName } : { displayname: displayName };

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    throw new Error(`Registration failed with status: ${response.status}`);
                }
                console.error("Registration API error:", errorData);
                throw new Error(errorData?.error || `Registration failed with status: ${response.status}`);
            }

            const responseData = await response.json();
            console.log("Registration response:", responseData);
            return responseData;
        } catch (error: any) {
            console.error("Registration service error:", error);
            throw error instanceof Error ? error : new Error("An unexpected error occurred during registration.");
        }
    },

    /**
     * Refreshes the authentication tokens using a refresh token.
     * @param {string} refreshToken - The current refresh token.
     * @returns {Promise<AuthResponse>} The new authentication tokens and expiry times.
     * @throws {Error} If token refresh fails.
     */
    async refreshAccessToken(refreshToken: string): Promise<AuthResponse> {
        const endpoint = useAppStore().backendEndpoint;
        console.debug("Calling /refresh endpoint to update access token..."); // !Dev

        try {
            const response = await fetch(`${endpoint}/auth/refresh`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ refresh_token: refreshToken }),
            });

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    throw new Error(`Token refresh failed with status: ${response.status}`);
                }
                console.error("Refresh token API error:", errorData);
                // Specific error handling for invalid refresh token might be useful
                throw new Error(errorData?.error || `Token refresh failed with status: ${response.status}`);
            }

            const responseData = await response.json();
            return responseData;
        } catch (error: any) {
            console.error("Refresh token service error:", error);
            throw error instanceof Error ? error : new Error("An unexpected error occurred during token refresh.");
        }
    },
};
