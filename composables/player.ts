import type { User, playerListObject } from "@/types";

export const usePlayerInfo = () => useState<User>("user_info", () => ({} as User));
export const useBackendAPI = () => useState<string | undefined>("backend_api", () => undefined);
// TODO: Will also be used when Users backend is added to the APP

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

export const registerPlayer = async (username: string, email: string, password: string): Promise<User | undefined> => {
    const backendAPI = useBackendAPI().value;
    if (!backendAPI) {
        console.error("Backend API is not defined");
        return undefined;
    }
    console.log("Registering player with:", { username, email, password }); //! Dev

    try {
        const response = await fetch(`${backendAPI}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, email, password }),
        });

        if (!response.ok) {
            throw new Error("Failed to register player");
        }

        const user: User = await response.json();
        usePlayerInfo().value = user;
        return user;
    } catch (error) {
        console.error("Error registering player:", error);
        throw error; // Re-throw the error to be caught in the component
    }
};
