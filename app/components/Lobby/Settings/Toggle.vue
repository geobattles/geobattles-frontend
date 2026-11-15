<template>
    <label class="check-row toggle-setting"
        ><input type="checkbox" v-model="model" /><span
            ><span>{{ label }}</span
            ><small v-if="description" class="field-help">{{ description }}</small></span
        ></label
    >
</template>
<script setup lang="ts">
defineProps<{ label: string; description?: string }>();
const model = defineModel<boolean>({ required: true });
</script>
<style scoped>
.toggle-setting {
    padding: 0.4rem 0.6rem;
    border: 1px solid var(--gb-line);
    border-radius: 8px;
}
small {
    display: block;
    margin-top: 0.15rem;
}
</style>
