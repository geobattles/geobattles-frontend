<template>
    <button type="button" class="btn btn-danger" aria-label="Leave lobby"><UiIcon name="leave" />{{ short ? "Leave" : "Leave lobby" }}</button>
</template>
<script setup lang="ts">
defineProps<{ short?: boolean }>();
</script>
