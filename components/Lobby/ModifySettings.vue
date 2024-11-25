<template>
    <div class="flex flex-row justify-evenly flex-wrap text-xs md:text-sm">
        <div v-if="lobbyStore.lobbySettings" class="basis-1/3 flex flex-col gap-5">
            <!-- Define lobby name section -->
            <div class="flex flex-col gap-1 w-56">
                <label for="username" class="text-xs">Lobby name</label>
                <InputText id="username" size="small" v-model="lobbyStore.lobbySettings.conf.name" aria-describedby="username-help" />
            </div>
            <!-- Define lobby GameMode section -->
            <div>
                <p class="mb-2 text-xs">Select game mode:</p>
                <div class="flex flex-wrap justify-between gap-2">
                    <div class="flex items-center">
                        <RadioButton v-model="lobbyStore.lobbySettings.conf.mode" inputId="battleRoyale" name="gameMode" :value="1" @change="gameFlowManager?.updateGameMode('BattleRoyale')" />
                        <label for="battleRoyale" class="ml-2">BattleRoyale</label>
                    </div>
                    <div class="flex items-center">
                        <RadioButton v-model="lobbyStore.lobbySettings.conf.mode" inputId="countryBattle" name="gameMode" :value="2" @change="gameFlowManager?.updateGameMode('CountryBattle')" />
                        <label for="countryBattle" class="ml-2">CountryBattle</label>
                    </div>
                </div>
            </div>
            <!-- Define lobby round timer section -->
            <div>
                <span>Round timer: {{ lobbyStore.lobbySettings.conf.roundTime || 60 }} seconds</span>
                <Slider ref="timer_slider" v-model="lobbyStore.lobbySettings.conf.roundTime" :min="1" :max="1000" class="w-14rem mt-3" />
            </div>
            <!-- Define lobby rounds, attempts and max players section -->
            <div class="flex flex-row flex-wrap justify-around gap-2">
                <div class="flex flex-col gap-1">
                    <label for="number-of-rounds-input" class="text-xs"> Rounds </label>
                    <InputNumber class="m-auto w-12" inputId="number-of-rounds-input" v-model="lobbyStore.lobbySettings.conf.numRounds" showButtons buttonLayout="vertical" :min="0" :max="10" @focus="handleFocus" />
                </div>
                <div class="flex flex-col gap-1">
                    <label for="attempts-per-rounds-input" class="text-xs"> Attempts </label>
                    <InputNumber class="m-auto w-12" inputId="attempts-per-rounds-input" v-model="lobbyStore.lobbySettings.conf.numAttempt" showButtons buttonLayout="vertical" :min="0" :max="5" @focus="handleFocus" />
                </div>
                {{ lobbyStore.lobbySettings.conf.numAttempt }}
                <div class="flex flex-col gap-1">
                    <label for="stacked-buttons" class="text-xs"> Max players </label>
                    <InputNumber class="m-auto w-12" v-model="lobbyStore.lobbySettings.conf.maxPlayers" style="width: 3rem" buttonLayout="vertical" inputId="stacked-buttons" :min="0" :max="20" showButtons mode="decimal" @focus="handleFocus" />
                </div>
            </div>
            <!-- Define lobby score factor section -->
            <div class="mt-4">
                <span>Score factor: {{ lobbyStore.lobbySettings.conf.scoreFactor || 150 }}</span>
                <Slider ref="score_factor" v-model="lobbyStore.lobbySettings.conf.scoreFactor" :min="50" :max="200" class="w-14rem mt-3" />
            </div>
            <!-- Define lobby dynamic lives and place bonus section -->
            <div style="display: flex; flex-direction: row; gap: 10px; scale: 0.9">
                <div style="width: 50%">
                    <Panel header="Dynamic lives" class="text-center">
                        <ToggleSwitch v-model="lobbyStore.lobbySettings.conf.dynLives" :checked="lobbyStore.lobbySettings.conf.dynLives" />
                    </Panel>
                </div>
                <div style="width: 50%">
                    <Panel header="Place bonus" class="text-center">
                        <ToggleSwitch v-model="lobbyStore.lobbySettings.conf.placeBonus" :checked="lobbyStore.lobbySettings.conf.placeBonus" />
                    </Panel>
                </div>
            </div>
            <!-- Define lobby powerups section -->
            <div v-if="lobbyStore.lobbySettings.conf.powerups" style="display: flex; flex-direction: row; gap: 10px; margin-top: 20px; scale: 0.9">
                <div style="width: 50%">
                    <Panel header="Double score" class="text-center">
                        <ToggleSwitch v-model="lobbyStore.lobbySettings.conf.powerups[0]" :checked="lobbyStore.lobbySettings.conf.powerups[0]" />
                    </Panel>
                </div>
                <div style="width: 50%">
                    <Panel header="Duel battle" class="text-center">
                        <ToggleSwitch v-model="lobbyStore.lobbySettings.conf.powerups[1]" :checked="lobbyStore.lobbySettings.conf.powerups[1]" />
                    </Panel>
                </div>
            </div>
        </div>
        <div v-else>
            <p>Lobby Setting are not defined!!!</p>
        </div>
        <!-- Component to select countries which user wants to play -->
        <Panel class="basis-1/3" header="Country Settings">
            <LobbyCountrySettings style="max-height: 800px" />
        </Panel>
    </div>
</template>

<script lang="ts" setup>
const timer_slider = ref();
const score_factor = ref();

// Extract services
const lobbyStore = useLobbyStore();
const gameFlowManager = useGameFlowManager();

onMounted(() => {
    score_factor.value.oninput = function () {
        // lobbySettings.value.conf.scoreFactor = parseInt(this.value);
        lobbyStore.updateLobbySetting("scoreFactor", parseInt(this.value));
    };
    timer_slider.value.oninput = function () {
        // lobbySettings.value.conf.roundTime = parseInt(this.value);
        lobbyStore.updateLobbySetting("roundTime", parseInt(this.value));
    };
});

const handleFocus = (event: Event) => {
    //? Maybe blur this only for mobile devices
    const target = event.target as HTMLElement;
    if (target) target.blur();
};
</script>

<style scoped></style>
