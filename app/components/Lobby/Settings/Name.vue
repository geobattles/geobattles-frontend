<template>
    <label class="name-setting" for="lobby-name" data-viewport-field>
        <span class="name-label">Lobby name</span>
        <input id="lobby-name" v-model="model" type="text" required maxlength="80" placeholder="Name your lobby" autocapitalize="sentences" enterkeyhint="done" />
        <span class="name-pencil" aria-hidden="true"><UiIcon name="pencil" /></span>
    </label>
</template>
<script setup lang="ts">
const model = defineModel<string>({ required: true });
</script>
<style scoped>
.name-setting {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 32px;
    align-items: center;
    gap: 0.05rem 0.5rem;
    padding: 0.42rem 0.65rem;
    border: 1px solid #9be0a52e;
    border-radius: 0.78rem;
    background: #06241ecc;
    cursor: text;
    transition: border-color 140ms ease;
}
.name-label {
    grid-column: 1;
    color: #aac9ba;
    font-size: 0.68rem;
    font-weight: 700;
}
.name-setting input {
    grid-column: 1;
    min-width: 0;
    width: 100%;
    min-height: 30px;
    padding: 0;
    background: transparent;
    border: 0;
    border-radius: 0;
    font-size: 0.92rem;
    font-weight: 760;
    color: #f4fbf3;
}
.name-pencil {
    grid-column: 2;
    grid-row: 1 / 3;
    display: grid;
    width: 30px;
    height: 30px;
    place-items: center;
    border-radius: 50%;
    background: #b6efa318;
    color: #b8f695;
}
.name-pencil .ui-icon {
    width: 0.88rem;
    height: 0.88rem;
}
.name-setting:focus-within {
    border-color: #b7f98699;
}
.name-setting input:focus-visible {
    outline: none;
}
</style>
