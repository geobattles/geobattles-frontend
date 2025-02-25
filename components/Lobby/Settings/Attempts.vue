<template>
    <div class="flex flex-col gap-1">
        <label for="attempts-per-rounds-input" class="text-xs"> Attempts </label>
        <InputNumber
            class="m-auto w-12"
            inputId="attempts-per-rounds-input"
            v-model="lobbyStore.lobbySettings!.conf.numAttempt"
            showButtons
            buttonLayout="vertical"
            :min="0"
            :max="5"
            @focus="handleFocus"
        />
    </div>
</template>

<script lang="ts">
export default {
    setup() {
        const lobbyStore = useLobbyStore();

        const handleFocus = (event: Event) => {
            //? Maybe blur this only for mobile devices
            const target = event.target as HTMLElement;
            if (target) target.blur();
        };

        return { lobbyStore, handleFocus };
    },
};
</script>

<style scoped></style>
