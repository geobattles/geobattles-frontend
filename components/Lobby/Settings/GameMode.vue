<template>
    <div>
        <p class="mb-2 text-xs">Select game mode:</p>
        <div class="flex flex-wrap justify-between gap-2">
            <div class="flex items-center">
                <RadioButton v-model="lobbyStore.lobbySettings!.conf.mode" inputId="battleRoyale" name="gameMode" :value="1" @change="gameStore.updateGameMode('BattleRoyale')" />
                <label for="battleRoyale" class="ml-2">BattleRoyale</label>
            </div>
            <div class="flex items-center">
                <RadioButton v-model="lobbyStore.lobbySettings!.conf.mode" inputId="countryBattle" name="gameMode" :value="2" @change="gameStore.updateGameMode('CountryBattle')" />
                <label for="countryBattle" class="ml-2">CountryBattle</label>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
export default {
    setup() {
        const lobbyStore = useLobbyStore();
        const gameStore = useGameplayStore();

        return { lobbyStore, gameStore };
    },
};
</script>

<style scoped></style>
