interface AuthResponse {
    Auth_token: string;
    Expiry: number;
}

export const authService = {
    /**
     * Authenticate a user with username and password
     */
    async login(username: string, password: string): Promise<AuthResponse> {
        const backendAPI = useBackendAPI().value;
        if (!backendAPI) throw new Error("Backend API is not defined");

        const response = await fetch(`${backendAPI}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Login failed");
        }

        return await response.json();
    },

    /**
     * Register a new user or guest
     */
    async register(username: string | null, password: string | null, displayName: string | null): Promise<AuthResponse> {
        const backendAPI = useBackendAPI().value;
        if (!backendAPI) throw new Error("Backend API is not defined");

        const isRegularUser = username && password;
        const endpoint = isRegularUser ? `${backendAPI}/register/user` : `${backendAPI}/register/guest`;
        const body = isRegularUser ? { username, password, displayname: displayName } : { displayname: displayName };

        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Registration failed");
        }

        return await response.json();
    },

    /**
     * Validate the current token with the backend
     */
    async validateToken(token: string): Promise<boolean> {
        const backendAPI = useBackendAPI().value;
        if (!backendAPI || !token) return false;

        try {
            const response = await fetch(`${backendAPI}/validate-token`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            return response.ok;
        } catch (error) {
            return false;
        }
    },
};
