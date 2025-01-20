import type { User } from "@/types/appTypes";

export const useAuthStore = defineStore("auth", () => {
    const isAuthenticated = ref(false);

    const saveToken = (token: string, expire: number): void => {
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
    };

    const getToken = (): string | null => {
        const playerTokenCookie = useCookie("saved_token");
        if (!playerTokenCookie.value) return null;
        console.log("Token DEV:", playerTokenCookie.value); //! Dev
        console.log("Setting isAuthenticated to true"); //! Dev

        isAuthenticated.value = true; // Set authentication status to true
        return playerTokenCookie.value;
    };

    const clearToken = (): void => {
        const playerTokenCookie = useCookie("saved_token");
        playerTokenCookie.value = null; // Clear the player token cookie
    };

    const isPlayerAuthenticated = (): boolean => {
        const token = getToken();
        const authenticated = isAuthenticated.value && token !== null;
        if (!authenticated) {
            console.log("Authentication check failed. Missing:", {
                isAuthenticated: isAuthenticated.value,
                token: token,
            });
        } //! Dev
        return authenticated;
    };

    const logout = (): void => {
        clearToken(); // Clear the player token

        usePlayerInfo().value = {} as User; // Clear player info
        isAuthenticated.value = false; // Set authentication status to false

        const socketStore = useWebSocketStore();
        socketStore.closeConnection();

        const router = useRouter();
        router.push({ path: "/" }); // Redirect to the main page

        console.log("Player has been logged out successfully"); //! Dev
    };

    const login = async (username: string, password: string): Promise<void> => {
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
                const errorText = await response.json();
                throw new Error(errorText.error);
            }

            const responseData: { Auth_token: string; Expiry: number } = await response.json();

            // Save the player token in a cookie
            saveToken(responseData.Auth_token, responseData.Expiry);

            // Parse the JWT to get data from it and save data
            saveTokenData(responseData.Auth_token);
        } catch (error) {
            console.error("Login failed:", error);
            isAuthenticated.value = false;
            throw error; // Re-throw the error to be caught in the component
        }
    };

    const register = async (username: string | null, password: string | null, displayName: string | null): Promise<void> => {
        const backendAPI = useBackendAPI().value;
        if (!backendAPI) return console.error("Backend API is not defined");

        const endpoint = username && password ? `${backendAPI}/register/user` : `${backendAPI}/register/guest`;
        const body = username && password ? { username, password, displayname: displayName } : { displayname: displayName };

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorText = await response.json();
                throw new Error(errorText.error);
            }

            const responseData: { Auth_token: string; Expiry: number } = await response.json();

            // Save the guest token in a cookie
            saveToken(responseData.Auth_token, responseData.Expiry);

            // Parse the JWT to get data from it and save data
            saveTokenData(responseData.Auth_token);
        } catch (error) {
            console.error("Registering failed:", error);
            isAuthenticated.value = false;
            throw error; // Re-throw the error to be caught in the component
        }
    };

    const saveTokenData = (token?: string): void => {
        const tokenToUse = token || getToken();
        if (!tokenToUse) throw new Error("Token is not defined");

        const tokenData = parseJwt(tokenToUse);
        if (!tokenData) throw new Error("Invalid token data");

        console.log("Token data DEV:", tokenData); //! Dev

        usePlayerInfo().value.username = tokenData.user_name; // Unique username
        usePlayerInfo().value.ID = tokenData.uid; // Unique user ID
        usePlayerInfo().value.displayName = tokenData.display_name; // Display name
        usePlayerInfo().value.guest = tokenData.guest;

        isAuthenticated.value = true;
    };

    const parseJwt = (token: string): any | null => {
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
    };

    return {
        isAuthenticated,
        saveToken,
        getToken,
        clearToken,
        isPlayerAuthenticated,
        logout,
        login,
        register,
        saveTokenData,
        parseJwt,
    };
});
