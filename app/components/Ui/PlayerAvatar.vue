<template>
    <span class="player-avatar" :style="{ color }" aria-hidden="true"><UiIcon name="user" /></span>
</template>

<script setup lang="ts">
import UiIcon from "./Icon.vue";

defineProps<{ color?: string }>();
</script>

<style scoped>
.player-avatar {
    display: inline-grid;
    place-items: center;
    flex: none;
    inline-size: var(--player-avatar-size, 1em);
    block-size: var(--player-avatar-size, 1em);
    border: 1px solid currentColor;
    border-radius: 3px;
    color: var(--gb-accent);
    background: var(--gb-bg);
}
.player-avatar > svg {
    inline-size: 72%;
    block-size: 72%;
}
</style>
