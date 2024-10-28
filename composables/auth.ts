export const useAuth = () => {
    // Main state to check if user is authenticated
    const isAuthenticated = useState("isAuthenticated", () => {
        console.log("isAuthenticated INITED"); //! Dev
        return false;
    });

    // State to check if the login dialog is visible (//TODO: Add this functionality)
    const isLoading = useState("isLoading", () => false);

    // State to check if the login dialog
    const isLoginDialogVisible = useState("isLoginDialogVisible", () => false);

    return {
        isAuthenticated,
        isLoginDialogVisible,
        isLoading,
    };
};
