<template>
    <header>
        <Menubar :model="items" breakpoint="600px">
            <template #start></template>
            <template #item="{ item, props, root }">
                <a v-ripple class="flex align-items-center" v-bind="props.action" :class="{ 'active-menuitem': isActive(item) }">
                    <span :class="item.icon" />
                    <span class="ml-2">{{ item.label }}</span>
                    <Badge v-if="item.badge !== undefined" :value="item.badge" />
                </a>
            </template>
            <template #end>
                <div v-if="!authStore.isAuthenticated" class="flex">
                    <div>
                        <Button
                            label="Login"
                            severity="primary"
                            size="small"
                            class="header-play-btn"
                            @click="handleLoginClick"
                        />
                    </div>
                </div>
                <div v-else class="flex gap-2 items-center">
                    <Tag icon="pi pi-user" severity="info" :value="playerInfo.displayName" />
                    <Button
                        v-if="showLogoutButton"
                        class="!bg-gradient-to-r !from-blue-600 !to-indigo-800 !border-none !text-white"
                        severity="primary"
                        type="button"
                        icon="pi pi-user-edit"
                        @click="toggleUserMenu"
                        aria-haspopup="true"
                        aria-controls="overlay_menu"
                    />
                    <Menu ref="userMenu" id="overlay_menu" :model="itemsProfile" :popup="true" />
                </div>
            </template>
        </Menubar>
        <Dialog v-if="authStore.isLoginDialog" v-model:visible="authStore.isLoginDialog" class="w-full lg:w-1/2" header="Login" position="center" :modal="true" :draggable="false">
            <Login @userLogged="authStore.isLoginDialog = false" />
        </Dialog>
    </header>
</template>

<script setup lang="ts">
import type { MenuItem } from "primevue/menuitem";
const userMenu = ref();

// External services
const lobbyStore = useLobbyStore();
const playerInfo = usePlayerInfo();
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const items: Ref<MenuItem[]> = ref([
    {
        label: "Home",
        icon: "pi pi-home",
        command: () => {
            router.push("/");
        },
        path: "/",
    },
    {
        label: "Online Lobbies",
        icon: "pi pi-map-marker",
        badge: Object.keys(lobbyStore.lobbyList).length,
        command: () => {
            router.push("/lobby/list");
        },
        path: "/lobby/list",
    },
    {
        label: "About",
        icon: "pi pi-info-circle",
        command: () => {
            router.push("/about");
        },
        path: "/about",
    },
]);

const itemsProfile: Ref<MenuItem[]> = ref([
    {
        label: "Profile",
        icon: "pi pi-user",
        command: () => {
            router.push("/profile");
        },
        path: "/profile",
    },
    {
        label: "Logout",
        icon: "pi pi-sign-out",
        class: "mt-1",
        command: () => {
            authStore.logout();
        },
    },
]);

// Toggle user menu
const toggleUserMenu = (event: any) => userMenu.value.toggle(event);

// Open Login dialog on Login button click
const handleLoginClick = () => (authStore.isLoginDialog = true);

// Check if Logout button should be shown
const showLogoutButton = computed(() => {
    const routeName = route.name as string;
    return !["lobby-id", "gameplay-id"].some((word) => routeName.includes(word));
});

// Check if current item in MenuBar is active (only for styling)
const isActive = (item: MenuItem) => route.path === item.path;

onMounted(async () => {
    // Fetch lobby list
    try {
        await lobbyStore.fetchLobbyList();
    } catch (error) {
        console.error("Failed to fetch lobby list in Header component:", error);
    }

    // Update active lobbies badge value
    items.value[1].badge = Object.keys(lobbyStore.lobbyList).length;
});
</script>

<style scoped>
.active-menuitem {
    font-weight: 600;
    color: var(--p-primary-color);
    background-color: var(--p-menubar-item-focus-background);
    border-radius: 4px;
}

.header-play-btn {
    width: 8rem;
    letter-spacing: 3px;
    padding: 8px 10px;
    border: none;
    color: #fff;
    background: linear-gradient(90deg, #90B77D 0%, #42855B 100%);
    box-shadow: 0 6px 14px rgba(66,133,91,0.12);
    transition: transform 0.2s ease, background 0.2s ease;
    border-radius: 6px;
    font-size: 0.875rem;
}

.header-play-btn:hover {
    transform: scale(1.03);
}

@media (min-width: 768px) {
    .header-play-btn {
        width: 10rem;
    }
}

@media (prefers-color-scheme: dark) {
    .header-play-btn {
        background: linear-gradient(90deg, #B6E388 0%, #5F8D4E 100%);
        color: #181c1b;
        box-shadow: 0 8px 18px rgba(0,0,0,0.25);
    }
}
</style>
