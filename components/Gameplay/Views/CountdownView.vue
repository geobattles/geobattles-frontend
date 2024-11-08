<template>
    <div class="timer">
        <span>
            {{ counter }}
        </span>
    </div>
</template>

<script setup lang="ts">
let counter = ref(3);
let interval: string | number | NodeJS.Timeout | undefined;
onMounted(() => {
    interval = setInterval(() => {
        if (counter.value > 1) {
            counter.value--;
        } else {
            clearInterval(interval);
        }
    }, 1000);
});

onUnmounted(() => {
    // Clear interval so it stop counting when unmounted
    clearInterval(interval);
});
</script>

<style scoped>
.timer {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;

    background-color: var(--p-surface-900);
    color: var(--p-primary-400);

    font-size: 10rem;

    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
}
</style>
