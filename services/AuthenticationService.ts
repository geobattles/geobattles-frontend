import type { Router } from "vue-router";
import type { User } from "@/types";

export class AuthenticationService {
    private isAuthenticated = false;

    constructor(private readonly router: Router) {
        console.log("Authentication service initialized"); //! Dev
    }

    public saveToken(token: string, expire: number): void {
        const maxAge = expire - Math.floor(Date.now() / 1000);
        const expiryDate = new Date(expire * 1000);
        console.log("Token will expire on:", expiryDate.toLocaleString()); //! Dev

        const playerTokenCookie = useCookie("saved_token", {
            maxAge: maxAge,
            sameSite: true,
            // secure: true, // Ensure the cookie is sent over HTTPS
            // httpOnly: true, // Prevent JavaScript access to the cookie
        });
        playerTokenCookie.value = token;
    }

    public getToken(): string | null {
        const playerTokenCookie = useCookie("saved_token");
        console.log("Player token cookie:", playerTokenCookie.value); //! Dev
        if (!playerTokenCookie.value) return null;
        return playerTokenCookie.value;
    }

    public clearToken(): void {
        const playerTokenCookie = useCookie("saved_token");
        playerTokenCookie.value = null; // Clear the player token cookie
    }

    public isPlayerAuthenticated(): boolean {
        return this.getToken() !== null;
    }

    public logout(): void {
        this.clearToken(); // Clear the player token

        usePlayerInfo().value = {} as User; // Clear player info
        this.isAuthenticated = false; // Set authentication status to false

        const { closeConnection } = useWebSocket();
        closeConnection();

        // Redirect to the main page
        this.router.push({ path: "/" });

        console.log("Player has been logged out successfully"); //! Dev
    }

    public async login(username: string, password: string): Promise<void> {
        const backendAPI = useBackendAPI().value;
        if (!backendAPI) return console.error("Backend API is not defined");

        try {
            const response = await fetch(`${backendAPI}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to login player: ${errorText}`);
            }

            const responseData: { Auth_token: string; Expiry: number } = await response.json();

            // Save the player token in a cookie
            this.saveToken(responseData.Auth_token, responseData.Expiry);
            console.log("Token saved:", responseData.Auth_token); //! Dev

            // Parse the JWT to get data from it and save data
            this.saveTokenData(responseData.Auth_token);
        } catch (error) {
            console.error("Error logging in player:", error);
            this.isAuthenticated = false;
            throw error; // Re-throw the error to be caught in the component
        }
    }

    public async register(username: string | null, password: string | null, displayName: string | null): Promise<void> {
        const backendAPI = useBackendAPI().value;
        if (!backendAPI) return console.error("Backend API is not defined");

        const endpoint = displayName ? `${backendAPI}/register/guest` : `${backendAPI}/register`;
        const body = displayName ? { username, password, displayname: displayName } : { displayname: displayName };

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to register guest: ${errorText}`);
            }

            const responseData: { Auth_token: string; Expiry: number } = await response.json();

            // Save the guest token in a cookie
            this.saveToken(responseData.Auth_token, responseData.Expiry);

            // Parse the JWT to get data from it and save data
            this.saveTokenData(responseData.Auth_token);
        } catch (error) {
            console.error("Error registering guest:", error);
            this.isAuthenticated = false;
            throw error; // Re-throw the error to be caught in the component
        }
    }

    public saveTokenData(token?: string): void {
        const tokenToUse = token || this.getToken();
        if (!tokenToUse) throw new Error("Token is not defined");

        const tokenData = this.parseJwt(tokenToUse);
        if (!tokenData) throw new Error("Invalid token data");

        console.log("Token data:", tokenData); //! Dev

        usePlayerInfo().value.username = tokenData.user_name; // Unique username
        usePlayerInfo().value.ID = tokenData.uid; // Unique user ID
        usePlayerInfo().value.displayName = tokenData.display_name; // Display name
        usePlayerInfo().value.guest = tokenData.guest;

        this.isAuthenticated = true;
    }

    private parseJwt(token: string): any | null {
        try {
            const base64Url = token.split(".")[1];
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split("")
                    .map((c) => {
                        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
                    })
                    .join("")
            );
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error("Error parsing JWT:", error);
            return null;
        }
    }
}
