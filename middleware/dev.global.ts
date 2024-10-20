export default defineNuxtRouteMiddleware((to, from) => {
    if (to.path !== "/") {
        if (!usePlayerInfo().value.username) {
            return navigateTo("/");
        }
    }
});
