<template>
    <header>
        <Menubar :model="items">
            <template #start></template>
            <template #item="{ item, props, root }">
                <a v-ripple class="flex align-items-center" v-bind="props.action">
                    <span :class="item.icon" />
                    <span class="ml-2">{{ item.label }}</span>
                    <Badge v-if="item.badge !== undefined" :value="item.badge" />
                </a>
            </template>
            <template #end>
                <div v-if="!isAuthenticated" class="flex">
                    <div>
                        <Button label="Login" size="small" @click="handleLoginClick" />
                    </div>
                </div>
                <div v-else>
                    <Button label="Logout" size="small" severity="secondary" raised @click="logoutPlayer()" />
                    <span class="ml-2">Welcome, {{ playerInfo.username }}!</span>
                </div>
            </template>
        </Menubar>
        <Dialog v-model:visible="isLoginDialogVisible" header="Login" style="width: 800px" position="center" :modal="true" :draggable="false">
            <Login @userLogged="isLoginDialogVisible = !isLoginDialogVisible" />
        </Dialog>
    </header>
</template>

<script>
export default {
    setup() {
        const playerInfo = usePlayerInfo();
        const router = useRouter();
        const isLoginDialogVisible = ref(false);
        const { isAuthenticated } = useAuth();

        const items = ref([
            {
                label: "Home",
                icon: "pi pi-home",
                command: () => {
                    router.push("/");
                },
            },
            {
                label: "Game Modes",
                icon: "pi pi-star",
            },
            {
                label: "Online Lobbies",
                icon: "pi pi-map-marker",
                badge: Object.keys(useLobbyList().value).length,
                command: () => {
                    router.push("/lobby/list");
                },
            },
            {
                label: "Contact",
                icon: "pi pi-envelope",
            },
        ]);

        const saveUsernameToCookies = () => {
            const player_username = useCookie("saved_username", {
                maxAge: 3600000, // Saves username cookie for 100 hours
            });
            player_username.value = playerInfo.value.username;
        };

        const handleLoginClick = () => {
            isLoginDialogVisible.value = true;
        };

        onMounted(async () => {
            try {
                await fetchLobbyList();
            } catch (error) {
                console.error("Failed to fetch lobby list in Header component:", error);
            }
            items.value[2].badge = Object.keys(useLobbyList().value).length;
        });

        return { isAuthenticated, playerInfo, items, router, isLoginDialogVisible, saveUsernameToCookies, handleLoginClick };
    },
};
</script>

<style scoped></style>
