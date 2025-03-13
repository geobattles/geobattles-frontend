<template>
    <div class="version-info">
        <div class="copyright">@ 2025 GeoBattles</div>
        <div class="version">Version: {{ version }} from {{ buildTime }}</div>
    </div>
</template>

<script setup lang="ts">
const runtimeConfig = useRuntimeConfig();

const version = ref(runtimeConfig.public.VERSION || "1.0.0");
const buildTime = ref(runtimeConfig.public.BUILD_DATE || new Date().toISOString());
</script>

<style scoped>
.version-info {
    color: var(--p-gray-500);
    text-align: center;
    padding: 0.5rem;
}
</style>
