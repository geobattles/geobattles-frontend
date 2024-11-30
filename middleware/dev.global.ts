export default defineNuxtRouteMiddleware((to, from) => {
    const allowedPaths = ["/", "/signup", "/lobby/list", "/lobby/join", "/about", "/test"];
    if (!allowedPaths.includes(to.path)) {
        if (!usePlayerInfo().value.ID) {
            return navigateTo("/");
        }
    }
});
