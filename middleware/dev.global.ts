export default defineNuxtRouteMiddleware((to, from) => {
    const authStore = useAuthStore();
    const allowedPaths = ["/", "/signup", "/lobby/list", "/lobby/join", "/about"];
    if (!allowedPaths.includes(to.path)) {
        if (!authStore.playerInfo.ID) {
            return navigateTo("/");
        }
    }
});
