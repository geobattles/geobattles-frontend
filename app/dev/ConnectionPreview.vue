<template>
    <main id="main-content" class="preview">
        <h1>Connection UI preview</h1>
        <div class="preview-controls">
            <label>
                Screen
                <select v-model="screen">
                    <option value="lobby">Waiting room</option>
                    <option value="round">During a round</option>
                </select>
            </label>
            <label>
                State
                <select :value="state" @change="selectState">
                    <option v-for="[value, label] in states" :key="value" :value="value">{{ label }}</option>
                </select>
            </label>
            <label>
                Width
                <select v-model="width">
                    <option value="wide">Available width</option>
                    <option value="phone">Phone · 390 px</option>
                    <option value="narrow">Narrow phone · 320 px</option>
                </select>
            </label>
            <button class="btn" type="button" @click="playRecovery">Play reconnect → restored</button>
        </div>

        <section class="sample" :class="[`sample--${width}`, { 'sample--round': inRound }]" :aria-label="inRound ? 'Sample round' : 'Sample waiting room'">
            <header>
                <strong>{{ inRound ? "Round 2 / 5" : "Expedition lobby" }}</strong>
                <span>{{ inRound ? "0:38" : "ABCD" }}</span>
            </header>
            <SocketConnectionBanner :status="notice" :round-running="inRound" :class="{ 'sample-banner--round': inRound }" />
            <div v-if="inRound" class="sample-view"><UiIcon name="compass" />Street View area</div>
            <div v-else class="sample-crew">
                <h2>Players</h2>
                <p>Alex · Host</p>
                <p>Sam · Ready</p>
            </div>
            <footer v-if="inRound">
                <button class="btn btn-secondary" type="button">Open map</button>
                <button class="btn" type="button" :disabled="blocked">Confirm guess</button>
            </footer>
            <footer v-else>
                <button v-if="state === 'closed'" class="btn btn-secondary" type="button" @click="showClosed = true">Lobby closed</button>
                <button v-else class="btn" type="button" :disabled="blocked">Ready to play</button>
            </footer>
        </section>

        <UiDialog v-if="state === 'closed'" v-model:open="showClosed" title="Lobby closed" class="preview-failure">
            <SocketConnectionPanel embedded tone="lost" title="Lobby closed" description="This lobby is no longer available." code="ABCD">
                <button class="btn" type="button" @click="setState('connected')">New lobby</button>
                <button class="btn btn-secondary" type="button" @click="setState('connected')">Home</button>
            </SocketConnectionPanel>
        </UiDialog>
        <button v-if="state === 'closed' && !showClosed && inRound" class="btn btn-secondary reopen" type="button" @click="showClosed = true">Show lobby-closed dialog</button>
    </main>
</template>

<script setup lang="ts">
import type { ConnectionNotice } from "~/composables/socketState";

type PreviewState = ConnectionNotice | "connected" | "closed";
const states: readonly [PreviewState, string][] = [
    ["connected", "Connected"],
    ["weak", "Slow connection"],
    ["offline", "Offline"],
    ["reconnecting", "Reconnecting"],
    ["restored", "Restored"],
    ["closed", "Lobby closed"],
];

const state = ref<PreviewState>("reconnecting");
const screen = ref<"lobby" | "round">("round");
const width = ref<"wide" | "phone" | "narrow">("phone");
const showClosed = ref(false);
const inRound = computed(() => screen.value === "round");
const blocked = computed(() => state.value === "offline" || state.value === "reconnecting" || state.value === "closed");
const notice = computed(() => (state.value === "connected" || state.value === "closed" ? null : state.value));
let replayTimer: ReturnType<typeof setTimeout> | undefined;

function setState(next: PreviewState) {
    clearTimeout(replayTimer);
    state.value = next;
    showClosed.value = next === "closed";
}
function selectState(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    const selected = states.find(([id]) => id === value);
    if (selected) setState(selected[0]);
}
function playRecovery() {
    setState("reconnecting");
    replayTimer = setTimeout(() => {
        setState("restored");
        replayTimer = setTimeout(() => setState("connected"), 2200);
    }, 1600);
}

onBeforeUnmount(() => clearTimeout(replayTimer));
useHead({ title: "Connection UI preview" });
</script>

<style scoped>
.preview {
    width: min(100% - 2rem, 58rem);
    margin-inline: auto;
    padding-block: 1.5rem;
}
.preview-controls {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: 0.75rem;
    margin-block: 1rem;
}
.preview-controls label {
    display: grid;
    gap: 0.3rem;
}
.preview-controls select {
    min-height: 44px;
    padding-inline: 0.6rem;
    border: 1px solid var(--gb-line);
    border-radius: 0.5rem;
    background: var(--gb-surface);
}
.sample {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    min-height: 22rem;
    min-width: 0;
    margin-inline: auto;
    overflow: hidden;
    border: 1px solid var(--gb-line);
    border-radius: 0.9rem;
    background: var(--gb-surface);
}
.sample--phone {
    width: min(100%, 390px);
}
.sample--narrow {
    width: min(100%, 320px);
}
.sample--round {
    min-height: min(34rem, 75dvh);
}
.sample header,
.sample footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: var(--gb-bg);
}
.sample header span {
    font-variant-numeric: tabular-nums;
}
.sample footer {
    margin-top: auto;
}
.sample-view,
.sample-crew {
    padding: 1rem;
}
.sample-view {
    flex: 1;
    display: grid;
    place-content: center;
    justify-items: center;
    gap: 0.4rem;
    color: var(--gb-muted);
    background: url("/images/atlas-relief.svg") center / cover no-repeat;
}
.sample-banner--round {
    position: absolute;
    inset: auto 12px 82px;
    max-width: 360px;
    margin-inline: auto;
    pointer-events: none;
}
.preview-failure {
    width: min(400px, calc(100% - 1rem));
}
.reopen {
    margin-top: 0.75rem;
}
</style>
