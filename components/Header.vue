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
                <div v-if="!auth.isPlayerAuthenticated()" class="flex">
                    <div>
                        <Button label="Login" size="small" @click="handleLoginClick" />
                    </div>
                </div>
                <div class="flex gap-2 items-center" v-else>
                    <Button label="Logout" size="small" severity="secondary" raised @click="auth.logout()" />
                    <span>{{ playerInfo.displayName }}</span>
                    <Button size="small" severity="secondary" type="button" icon="pi pi-user-edit" @click="toggleUserMenu" aria-haspopup="true" aria-controls="overlay_menu" />
                    <Menu ref="userMenu" id="overlay_menu" :model="itemsProfile" :popup="true" />
                </div>
            </template>
        </Menubar>
        <Dialog v-model:visible="isLoginDialogVisible" header="Login" style="width: 800px" position="center" :modal="true" :draggable="false">
            <Login @userLogged="isLoginDialogVisible = !isLoginDialogVisible" />
        </Dialog>
    </header>
</template>

<script setup lang="ts">
const playerInfo = usePlayerInfo();
const router = useRouter();
const userMenu = ref();
const isLoginDialogVisible = useIsLoginDialogVisible();
const auth = useAuthenticationService().value;

const items = ref([
    {
        label: "Home",
        icon: "pi pi-home",
        command: () => {
            router.push("/");
        },
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
        label: "About",
        icon: "pi pi-info-circle",
        command: () => {
            router.push("/about");
        },
    },
]);

const itemsProfile = ref([
    {
        label: "Profile",
        icon: "pi pi-user",
        command: () => {
            router.push("/profile");
        },
    },
    // {
    //     label: "Settings",
    //     icon: "pi pi-cog",
    //     command: () => {
    //         router.push("/settings");
    //     },
    // },
]);

const toggleUserMenu = (event: any) => {
    userMenu.value.toggle(event);
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
    items.value[1].badge = Object.keys(useLobbyList().value).length;
});
</script>

<style scoped></style>
