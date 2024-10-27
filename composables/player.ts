import type { User } from "@/types";

export const usePlayerInfo = () => useState<User>("user_info", () => ({} as User));
export const useBackendAPI = () => useState<string | undefined>("backend_api", () => undefined);

export const getPlayerColorByID = (id: string | number): string | undefined => {
    const lobby_info = useLobbySettings();
    const player = lobby_info.value.playerList[id];
    if (!player) return undefined;
    return player.color;
};

export const getPlayerNameFromID = (id: string | number): string | undefined => {
    const lobby_info = useLobbySettings();
    const player = lobby_info.value.playerList[id];
    if (!player) return undefined;
    return player.name;
};

export const getToken = () => {
    const playerTokenCookie = useCookie("saved_token");
    return playerTokenCookie.value;
};

export const registerPlayer = async (username: string, display_name: string, password: string): Promise<void> => {
    const backendAPI = useBackendAPI().value;
    if (!backendAPI) return console.error("Backend API is not defined");

    const { isAuthenticated } = useAuth();

    try {
        const response = await fetch(`${backendAPI}/register/user`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, displayname: display_name, password }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to login player: ${errorText}`);
        }

        const responseData: { Auth_token: string; Expiry: number } = await response.json();

        // Save the player token in a cookie
        const maxAge = responseData.Expiry - Math.floor(Date.now() / 1000);
        const expiryDate = new Date(responseData.Expiry * 1000);
        console.log("Token will expire on:", expiryDate.toLocaleString()); //! Dev
        const playerTokenCookie = useCookie("saved_token", {
            maxAge: maxAge,
            sameSite: true,
            // secure: true, // Ensure the cookie is sent over HTTPS
            // httpOnly: true, // Prevent JavaScript access to the cookie
        });
        playerTokenCookie.value = responseData.Auth_token;

        // Parse the JWT to get data from it
        const tokenData = parseJwt(responseData.Auth_token);
        if (!tokenData) throw new Error("Invalid token data");

        usePlayerInfo().value.username = tokenData.user_name; // Unique username
        usePlayerInfo().value.ID = tokenData.uid; // Unique user ID
        usePlayerInfo().value.displayName = tokenData.display_name; // Display name

        isAuthenticated.value = true;
    } catch (error) {
        console.error("Error registering player:", error);
        isAuthenticated.value = false;
        throw error; // Re-throw the error to be caught in the component
    }
};

export const loginPlayer = async (username: string, password: string): Promise<void> => {
    const backendAPI = useBackendAPI().value;
    if (!backendAPI) return console.error("Backend API is not defined");

    const { isAuthenticated } = useAuth();

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
        const maxAge = responseData.Expiry - Math.floor(Date.now() / 1000);
        const expiryDate = new Date(responseData.Expiry * 1000);
        console.log("Token will expire on:", expiryDate.toLocaleString()); //! Dev
        const playerTokenCookie = useCookie("saved_token", {
            maxAge: maxAge,
            sameSite: true,
            // secure: true, // Ensure the cookie is sent over HTTPS
            // httpOnly: true, // Prevent JavaScript access to the cookie
        });
        playerTokenCookie.value = responseData.Auth_token;

        // Parse the JWT to get data from it
        const tokenData = parseJwt(responseData.Auth_token);
        if (!tokenData) throw new Error("Invalid token data");

        usePlayerInfo().value.username = tokenData.user_name; // Unique username
        usePlayerInfo().value.ID = tokenData.uid; // Unique user ID
        usePlayerInfo().value.displayName = tokenData.display_name; // Display name

        isAuthenticated.value = true;
    } catch (error) {
        console.error("Error logging in player:", error);
        isAuthenticated.value = false;
        throw error; // Re-throw the error to be caught in the component
    }
};

export const logoutPlayer = (): void => {
    const { isAuthenticated } = useAuth();
    const playerTokenCookie = useCookie("saved_token");

    // Clear the player token cookie
    playerTokenCookie.value = null;

    // Clear player info
    usePlayerInfo().value = {} as User;

    // Set authentication status to false
    isAuthenticated.value = false;

    console.log("Player has been logged out successfully"); //! Dev
};

/**
 *
 * @param token
 * @returns
 */
export const parseJwt = (token: string) => {
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
