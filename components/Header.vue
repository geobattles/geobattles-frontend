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
                <div class="flex flex-col">
                    <InputText id="username" v-model="usePlayerInfo().value.name" @blur="saveUsernameToCookies" placeholder="Username" aria-describedby="username-help" size="small" />
                    <small id="username-help">Enter your username.</small>
                </div>
            </template>
        </Menubar>
    </header>
</template>

<script>
export default {
    setup() {
        const player_info = usePlayerInfo();
        const router = useRouter();

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
            player_username.value = player_info.value.name;
        };

        onMounted(async () => {
            await fetchLobbyList();
            items.value[2].badge = Object.keys(useLobbyList().value).length;
        });

        return { player_info, items, saveUsernameToCookies };
    },
};
</script>

<style scoped></style>
