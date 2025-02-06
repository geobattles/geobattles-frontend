<template>
    <div class="flex flex-col gap-1">
        <span>Round timer: {{ lobbyStore.lobbySettings!.conf.roundTime || 60 }} seconds</span>
        <Slider ref="timer-slider" v-model="lobbyStore.lobbySettings!.conf.roundTime" :min="1" :max="1000" class="w-14rem mt-3" />
    </div>
</template>

<script lang="ts">
export default {
    setup() {
        const lobbyStore = useLobbyStore();
        const timerSlider = useTemplateRef<HTMLInputElement>("timer-slider");

        onMounted(() => {
            timerSlider.value!.oninput = () => lobbyStore.updateLobbyConfigSetting("roundTime", parseInt(timerSlider.value!.value));
        });

        return { lobbyStore, timerSlider };
    },
};
</script>

<style scoped></style>
