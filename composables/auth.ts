export const useAuth = () => {
    const isAuthenticated = useState("isAuthenticated", () => {
        console.log("isAuthenticated INITED"); //! Dev
        return false;
    });
    const isLoading = useState("isLoading", () => false);

    const authenticateUser = async (username: string, password: string): Promise<void> => {
        const backendAPI = useBackendAPI().value;
        isLoading.value = true;
        try {
            const response = await fetch(`${backendAPI}/login/user`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                const data = await response.json();
                isAuthenticated.value = data.success;
            } else {
                isAuthenticated.value = false;
            }
        } catch (error) {
            console.error("Authentication failed", error);
            isAuthenticated.value = false;
        } finally {
            isLoading.value = false;
        }
    };

    return {
        isAuthenticated,
        isLoading,
        authenticateUser,
    };
};
