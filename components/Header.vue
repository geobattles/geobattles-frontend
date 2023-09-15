<template>
    <header class="header h-28 sm:h-20">
        <NuxtLink to="/" class="font-bold leading-tight text-3xl mt-0 mb-2 text-white-600">GeoBattles</NuxtLink>
        <div style="display: flex">
            <div class="player-name">
                <div>Username:</div>
                <div>
                    <input type="text" v-model="player_info.name" @blur="saveUsernameToCookies" placeholder="_______________" />
                </div>
            </div>
        </div>
    </header>
</template>

<script lang="ts">
export default {
    setup() {
        const player_info = usePlayerInfo();
        const saveUsernameToCookies = () => {
            const player_username = useCookie("saved_username", {
                maxAge: 3600000, // Saves username cookie for 100 hours
            });
            player_username.value = player_info.value.name;
        };
        return { saveUsernameToCookies, player_info };
    },
};
</script>

<style scoped>
.header {
    color: white;
    background-color: var(--color-grey-dark-1);
    top: 0;
    padding: 5px;
    z-index: 10;

    /* Flexbox header */
    display: flex;
    justify-content: space-between;
    align-items: center;

    margin-bottom: 4vh;
}
@media (max-width: 350px) {
    .header {
        flex-direction: column;
        justify-content: center;
    }
}

.player-name {
    text-align: center;
    min-width: 0;
}

.player-name input {
    max-width: 120px;
    background-color: var(--color-grey-dark-2);

    font-size: 1rem;
    border-radius: 3px;
    color: white;
    min-width: 0;
    padding: 2px 4px;

    border: none;
    outline: none;
}

.player-name input:focus {
    background-color: var(--color-grey-dark-3);
    min-width: 0;
}
</style>
