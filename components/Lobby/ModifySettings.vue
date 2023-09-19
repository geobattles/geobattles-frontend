<template>
    <div class="settings-overlay">
        <div class="modal">
            <div>Here we will update settings!</div>
            <button @click="this_modal = false">Close</button>
        </div>
    </div>
</template>

<script lang="ts">
import { useModifySettingsModal } from "~/composables/states";

export default {
    setup() {
        const this_modal = useModifySettingsModal();
        return { this_modal };
    },
};
</script>

<style scoped>
.settings-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(5px);
    z-index: 9999;
    display: flex;
    justify-content: center;
    align-items: center;
}

.modal {
    background-color: white;
    padding: 20px;
    border-radius: 5px;

    width: 300px;
    height: 300px;
}
</style>
