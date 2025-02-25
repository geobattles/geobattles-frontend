<template>
    <div class="flex flex-col gap-1">
        <span class="m-auto">Score factor: {{ lobbyStore.lobbySettings!.conf.scoreFactor || 150 }}</span>
        <Slider ref="score-factor" v-model="lobbyStore.lobbySettings!.conf.scoreFactor" :min="1" :max="200" class="w-14rem mt-3" />
    </div>
</template>

<script lang="ts">
export default {
    setup() {
        const lobbyStore = useLobbyStore();
        const scoreFactorSlider = useTemplateRef<HTMLInputElement>("score-factor");

        onMounted(() => {
            // Set the initial values for the sliders
            scoreFactorSlider.value!.oninput = () => lobbyStore.updateLobbyConfigSetting("scoreFactor", parseInt(scoreFactorSlider.value!.value));
        });

        return { lobbyStore };
    },
};
</script>

<style scoped></style>
