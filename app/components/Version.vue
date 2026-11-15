<template>
    <footer class="version-info">
        <p>GeoBattles · Open-source exploration</p>
        <p v-if="version" class="mt-1">
            Build {{ version }}<span v-if="buildTime"> · {{ buildTime }}</span>
        </p>
    </footer>
</template>
<script setup lang="ts">
const config = useRuntimeConfig();
const version = config.public.VERSION;
const buildTime = config.public.BUILD_DATE;
</script>
<style scoped>
.version-info {
    color: var(--gb-muted);
    font-size: 0.7rem;
    overflow-wrap: anywhere;
}
</style>
