export default defineNuxtRouteMiddleware((to, from) => {
    const allowedPaths = ["/", "/signup", "/lobby/list", "/about"];
    if (!allowedPaths.includes(to.path)) {
        if (!usePlayerInfo().value.username) {
            return navigateTo("/");
        }
    }
});
