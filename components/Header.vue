<template>
    <header class="header-custom">
        <Menubar :model="items" style="font-size: 12px">
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
                <div class="card flex justify-content-center">
                    <InputText id="username" v-model="player_info.name" @blur="saveUsernameToCookies" context="Tes" placeholder="Username" />
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
                    if (player_info.value.isConnectedToLobby) {
                        if (confirm("Are you sure you want to leave the lobby?")) {
                            router.push("/");
                        }
                    }
                },
            },
            {
                label: "Game Modes",
                icon: "pi pi-star",
            },
            {
                label: "Contact",
                icon: "pi pi-envelope",
                badge: 3,
            },
        ]);

        const saveUsernameToCookies = () => {
            const player_username = useCookie("saved_username", {
                maxAge: 3600000, // Saves username cookie for 100 hours
            });
            player_username.value = player_info.value.name;
        };

        return { player_info, items, saveUsernameToCookies };
    },
};
</script>

<style scoped>
.header-custom {
}
</style>
