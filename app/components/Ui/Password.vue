<template>
    <div class="password-field">
        <input
            :id="id"
            v-model="model"
            :type="visible ? 'text' : 'password'"
            :autocomplete="autocomplete"
            :required="required"
            :minlength="minlength"
            :enterkeyhint="enterkeyhint"
            :aria-invalid="invalid || undefined"
            :aria-describedby="describedby"
            class="input"
        />
        <button class="btn btn-quiet btn-icon" type="button" :aria-label="visible ? 'Hide password' : 'Show password'" :aria-pressed="visible" @click="visible = !visible">
            <UiIcon name="eye" />
        </button>
    </div>
</template>
<script setup lang="ts">
defineProps<{ id: string; autocomplete?: string; required?: boolean; minlength?: number; invalid?: boolean; describedby?: string; enterkeyhint?: "go" }>();
const model = defineModel<string>({ required: true });
const visible = ref(false);
</script>
