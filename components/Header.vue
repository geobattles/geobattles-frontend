<template>
    <header class="header-custom">
        <Menubar :model="items" class="text-sm">
            <template #start> </template>
            <template #item="{ item, props, root }">
                <a v-ripple class="flex align-items-center" v-bind="props.action">
                    <span :class="item.icon" />
                    <span class="ml-2">{{ item.label }}</span>
                    <Badge v-if="item.badge" :class="{ 'ml-auto': !root, 'ml-2': root }" :value="item.badge" />
                    <span v-if="item.shortcut" class="ml-auto border-1 surface-border border-round surface-100 text-xs p-1">{{ item.shortcut }}</span>
                </a>
            </template>
            <template #end>
                <div class="flex">
                    <div>
                        <Button label="Login" size="small" @click="handleLoginClick" />
                    </div>
                    <div class="flex flex-wrap gap-2">
                        <InputText id="username" v-model="usePlayerInfo().value.username" @blur="saveUsernameToCookies" placeholder="Username" aria-describedby="username-help" size="small" :invalid="!usePlayerInfo().value.username" />
                        <Message v-if="!usePlayerInfo().value.username" severity="error" icon="pi pi-times-circle" />
                    </div>
                </div>
            </template>
        </Menubar>
        <Dialog v-model:visible="isLoginDialogVisible" header="Login" style="width: 800px" position="center" :modal="true" :draggable="false">
            <Login />
        </Dialog>
    </header>
</template>

<script>
export default {
    setup() {
        const player_info = usePlayerInfo();
        const router = useRouter();
        const isLoginDialogVisible = ref(false);

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
            player_username.value = player_info.value.username;
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

        return { player_info, items, router, isLoginDialogVisible, saveUsernameToCookies, handleLoginClick };
    },
};
</script>

<style scoped></style>
