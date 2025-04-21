<template>
    <div class="flex flex-col gap-1">
        <label for="number-of-rounds-input" class="text-xs"> Rounds </label>
        <InputNumber
            class="m-auto w-12"
            inputId="number-of-rounds-input"
            v-model="lobbyStore.lobbySettings!.conf.numRounds"
            showButtons
            buttonLayout="vertical"
            :min="1"
            :max="10"
            @focus="handleFocus"
        />
    </div>
</template>

<script lang="ts">
export default {
    setup() {
        const lobbyStore = useLobbyStore();

        const handleFocus = (event: Event) => {
            const target = event.target as HTMLElement;
            if (target) target.blur();
        };

        return { lobbyStore, handleFocus };
    },
};
</script>

<style scoped></style>
