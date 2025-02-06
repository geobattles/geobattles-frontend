<template>
    <div style="width: 50%">
        <Panel :header="label" class="text-center">
            <ToggleSwitch v-model="modelValueProxy" />
        </Panel>
    </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";

export default defineComponent({
    props: {
        label: { type: String, required: true }, // Label for the setting
        modelValue: { type: Boolean, required: true }, // v-model binding
    },
    emits: ["update:modelValue"], // Emit changes for v-model

    setup(props, { emit }) {
        const modelValueProxy = computed({
            get: () => props.modelValue,
            set: (value) => emit("update:modelValue", value),
        });

        return { modelValueProxy };
    },
});
</script>

<style scoped></style>
