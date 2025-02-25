<template>
    <div class="flex flex-col gap-1">
        <label for="stacked-buttons" class="text-xs"> Max players </label>
        <InputNumber
            class="m-auto w-12"
            v-model="lobbyStore.lobbySettings!.conf.maxPlayers"
            style="width: 3rem"
            buttonLayout="vertical"
            inputId="stacked-buttons"
            :min="0"
            :max="20"
            showButtons
            mode="decimal"
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
