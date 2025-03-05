import type { User } from "@/types/appTypes";

export const useAuthStore = defineStore("auth", () => {
    const isAuthenticated = ref(false);
    const authError = ref<string | null>(null);

    // Token management functions remain the same
    const saveToken = (token: string, expire: number): void => {
        const maxAge = expire - Math.floor(Date.now() / 1000);

        const playerTokenCookie = useCookie("saved_token", {
            maxAge: maxAge,
            sameSite: true,
            // secure: true, // Enable in production
            // httpOnly: true, // Enable in production
        });
        playerTokenCookie.value = token;
    };

    const getToken = (): string | null => {
        const playerTokenCookie = useCookie("saved_token");
        if (!playerTokenCookie.value) return null;
        return playerTokenCookie.value;
    };

    const clearToken = (): void => {
        const playerTokenCookie = useCookie("saved_token");
        playerTokenCookie.value = null;
    };

    // Authentication state functions
    const isPlayerAuthenticated = (): boolean => {
        const token = getToken();
        isAuthenticated.value = isAuthenticated.value && token !== null;
        return isAuthenticated.value;
    };

    const logout = (): void => {
        clearToken();
        usePlayerInfo().value = {} as User;
        isAuthenticated.value = false;

        const socketStore = useWebSocketStore();
        socketStore.disconnect();

        const router = useRouter();
        router.push({ path: "/" });
    };

    // Authentication API interactions now use the service
    const login = async (username: string, password: string): Promise<void> => {
        try {
            authError.value = null;
            const responseData = await authService.login(username, password);

            saveToken(responseData.Auth_token, responseData.Expiry);
            saveTokenData(responseData.Auth_token);
        } catch (error: any) {
            isAuthenticated.value = false;
            authError.value = error.message;
            throw error;
        }
    };

    const register = async (username: string | null, password: string | null, displayName: string | null): Promise<void> => {
        try {
            authError.value = null;
            const responseData = await authService.register(username, password, displayName);

            saveToken(responseData.Auth_token, responseData.Expiry);
            saveTokenData(responseData.Auth_token);
        } catch (error: any) {
            isAuthenticated.value = false;
            authError.value = error.message;
            throw error;
        }
    };

    const saveTokenData = (token?: string): void => {
        const tokenToUse = token || getToken();
        if (!tokenToUse) throw new Error("Token is not defined");

        const tokenData = parseJwt(tokenToUse);
        if (!tokenData) throw new Error("Invalid token data");

        const playerInfo = usePlayerInfo();
        playerInfo.value.username = tokenData.user_name; // Unique username
        playerInfo.value.ID = tokenData.uid; // Unique user ID
        playerInfo.value.displayName = tokenData.display_name; // Display name
        playerInfo.value.guest = tokenData.guest;

        isAuthenticated.value = true;
    };

    return {
        isAuthenticated,
        authError,
        saveToken,
        getToken,
        clearToken,
        isPlayerAuthenticated,
        logout,
        login,
        register,
        saveTokenData,
    };
});
