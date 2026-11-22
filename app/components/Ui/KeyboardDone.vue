<template>
    <button type="button" class="btn btn-secondary keyboard-done" @pointerdown.prevent>Done typing</button>
</template>

<style scoped>
.keyboard-done {
    flex: none;
    min-height: 44px;
    padding: 0.35rem 0.7rem;
    white-space: nowrap;
    font-size: 0.8rem;
}
</style>
