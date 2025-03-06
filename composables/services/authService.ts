interface AuthResponse {
    Auth_token: string;
    Expiry: number;
}

export const authService = {
    /**
     * Authenticate a user with username and password
     */
    async login(username: string, password: string): Promise<AuthResponse> {
        const endpoint = useAppStore().backendEndpoint;

        const response = await fetch(`${endpoint}/login`, {
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
        const baseEndpoint = useAppStore().backendEndpoint;
        const isRegularUser = username && password;
        const endpoint = isRegularUser ? `${baseEndpoint}/register/user` : `${baseEndpoint}/register/guest`;
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
        const endpoint = useAppStore().backendEndpoint;
        if (!token) return false;

        try {
            const response = await fetch(`${endpoint}/validate-token`, {
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
