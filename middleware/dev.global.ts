export default defineNuxtRouteMiddleware((to, from) => {
    if (to.path !== "/") {
        if (!usePlayerInfo().value.name) {
            return navigateTo("/");
        }
    }
});
