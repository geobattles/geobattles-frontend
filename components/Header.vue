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
                        <Button label="Login" size="small" severity="contrast" @click="handleLoginClick" />
                    </div>
                </div>
                <div v-else class="flex gap-2 items-center">
                    <Button v-if="showLogoutButton" label="Logout" size="small" severity="contrast" raised @click="auth.logout()" />
                    <Tag icon="pi pi-user" severity="info" :value="playerInfo.displayName" />
                    <Button v-if="showLogoutButton" size="small" severity="contrast" type="button" icon="pi pi-user-edit" @click="toggleUserMenu" aria-haspopup="true" aria-controls="overlay_menu" />
                    <Menu ref="userMenu" id="overlay_menu" :model="itemsProfile" :popup="true" />
                </div>
            </template>
        </Menubar>
        <Dialog v-model:visible="isLoginDialogVisible" class="w-full lg:w-1/2" header="Login" position="center" :modal="true" :draggable="false">
            <Login class="m-10" @userLogged="isLoginDialogVisible = !isLoginDialogVisible" />
        </Dialog>
    </header>
</template>

<script setup lang="ts">
const userMenu = ref();

// External services
const lobbyStore = useLobbyStore();
const playerInfo = usePlayerInfo();
const router = useRouter();
const route = useRoute();
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
        badge: Object.keys(lobbyStore.lobbyList).length,
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

const showLogoutButton = computed(() => {
    const routeName = route.name as string;
    return !["lobby-id", "gameplay-id"].some((word) => routeName.includes(word));
});

onMounted(async () => {
    try {
        await lobbyStore.fetchLobbyList();
    } catch (error) {
        console.error("Failed to fetch lobby list in Header component:", error);
    }
    items.value[1].badge = Object.keys(lobbyStore.lobbyList).length;
});
</script>

<style scoped></style>
