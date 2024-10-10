<template>
    <div id="countdown_container">Countdown 3, 2, 1. GO</div>
</template>

<script lang="ts">
export default {
    setup() {
        onMounted(() => {});

        return {};
    },
};
</script>

<style scoped>
#countdown_container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 3rem;
    font-weight: bold;
    color: var(--p-primary-400);
    background-color: var(--p-zinc-900);
    z-index: 9999;
}
</style>
