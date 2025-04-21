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

    /**
     * Updates a user's profile information (display name and/or password).
     * @param {string | null} displayName - The new display name (null if not updating).
     * @param {string | null} password - The new password (null if not updating).
     * @param {string} accessToken - The user's access token for authentication.
     * @returns {Promise<AuthResponse>} Result of the update operation.
     * @throws {Error} If update fails.
     */
    async updateUser(displayName: string | null, password: string | null, accessToken: string): Promise<AuthResponse> {
        const endpoint = useAppStore().backendEndpoint;

        // Don't proceed if nothing to update
        if (!displayName && !password) {
            throw new Error("Nothing to update. Provide display name or password.");
        }

        // Build request body with fields to be updated
        const updateData: Record<string, string> = {};
        if (displayName) updateData.DisplayName = displayName;
        if (password) updateData.Password = password;

        try {
            const response = await fetch(`${endpoint}/updateUser`, {
                // Assuming the endpoint is under /auth
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `${accessToken}`, // Keep Authorization header as standard practice
                },
                body: JSON.stringify(updateData),
            });

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    throw new Error(`Profile update failed with status: ${response.status}`);
                }
                console.error("Update user API error:", errorData);
                throw new Error(errorData?.error || `Profile update failed with status: ${response.status}`);
            }

            // Assuming the backend returns a success message or confirmation
            const responseData = await response.json();
            return responseData;
        } catch (error: any) {
            console.error("Update user service error:", error);
            throw error instanceof Error ? error : new Error("An unexpected error occurred during profile update.");
        }
    },

    /**
     * Logs out a user by notifying the backend.
     * The backend should invalidate the session/token based on the provided access token.
     * @param {string} accessToken - The access token of the user logging out.
     * @returns {Promise<void>}
     * @throws {Error} If logout fails on the backend.
     */
    async logout(accessToken: string): Promise<void> {
        // Parameter changed to accessToken
        const endpoint = useAppStore().backendEndpoint;

        try {
            // Changed method to GET as per user request
            const response = await fetch(`${endpoint}/auth/logout`, {
                method: "GET", // Use GET for logout action
                headers: {
                    // Send the access token in the Authorization header
                    Authorization: `${accessToken}`,
                },
            });

            if (!response.ok) {
                let errorData;
                try {
                    // Attempt to parse error only if there's content
                    if (response.headers.get("content-length") !== "0") {
                        errorData = await response.json();
                    }
                } catch (e) {
                    // Ignore JSON parsing errors if response is not JSON
                    console.warn("Could not parse JSON error response from logout endpoint.");
                }
                console.error("Logout API error:", errorData || `Status: ${response.status}`);
                // Throw specific error if available, otherwise generic status error
                throw new Error(errorData?.error || `Backend logout failed with status: ${response.status}`);
            }

            // Logout successful, no specific data expected in response body for logout
            console.debug("Backend logout request successful.");
        } catch (error: any) {
            console.error("Logout service error:", error);
            // Re-throw the error to be handled by the caller (e.g., authStore)
            throw error instanceof Error ? error : new Error("An unexpected error occurred during backend logout.");
        }
    },
};
