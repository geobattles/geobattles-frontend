<template>
    <header class="expedition-topbar" :class="{ 'is-compact': compact }">
        <span class="expedition-brand"
            ><img src="/images/emerald-mark.svg" width="30" height="32" alt="GeoBattles" /><span aria-hidden="true">Geo<b>Battles</b></span></span
        >
        <slot />
        <div class="expedition-actions" aria-label="Game controls">
            <button
                v-if="!compact"
                ref="scoresToggle"
                class="hud-button scores-toggle"
                type="button"
                :aria-label="'Round scores, ' + players + (players === 1 ? ' player' : ' players')"
                :aria-expanded="scoresOpen"
                :aria-controls="scoreboardId"
                title="Round scores"
                @click="emit('toggleScores')"
            >
                <UiIcon name="users" /><span>{{ players }} {{ players === 1 ? "player" : "players" }}</span>
            </button>
            <button
                v-if="ui.fullscreenAvailable"
                class="hud-button"
                type="button"
                :aria-label="ui.isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
                :title="ui.isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
                @click="ui.toggleFullscreen()"
            >
                <UiIcon name="fullscreen" />
            </button>
            <button class="hud-button leave-control" type="button" aria-label="Leave lobby" title="Leave lobby" @click="emit('leaveLobbyClicked')">
                <UiIcon name="leave" />
            </button>
        </div>
    </header>
</template>
<script setup lang="ts">
defineProps<{ players: number; scoresOpen: boolean; scoreboardId: string; compact: boolean }>();
const emit = defineEmits<{ leaveLobbyClicked: []; toggleScores: [] }>();
const ui = useUIManagerStore();
const scoresToggle = useTemplateRef("scoresToggle");
defineExpose({ focusScores: () => scoresToggle.value?.focus({ preventScroll: true }) });
</script>
<style scoped>
.expedition-topbar {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-inline-size: 0;
    block-size: var(--hud-header);
    gap: clamp(0.5rem, 2.4vw, 2rem);
    padding: env(safe-area-inset-top) var(--hud-right) 0 var(--hud-left);
    border-block-end: 1px solid #b7fca350;
    background:
        url("/images/atlas-relief.svg") 22% 49% / 36rem auto no-repeat,
        linear-gradient(100deg, #082f28, #031e1c 72%);
    box-shadow: 0 3px 18px #00181255;
    pointer-events: auto;
}
.expedition-brand {
    display: inline-flex;
    flex: none;
    align-items: center;
    gap: 0.55rem;
    white-space: nowrap;
    font: italic 900 clamp(1.12rem, 1.8vw, 1.5rem) / 1 var(--gb-font-display);
    letter-spacing: -0.055em;
}
.expedition-brand img {
    inline-size: clamp(1.25rem, 2vw, 1.85rem);
    block-size: auto;
}
.expedition-brand b {
    color: var(--round-accent);
}
.expedition-actions {
    display: flex;
    justify-content: end;
    align-items: center;
    gap: clamp(0.18rem, 0.75vw, 0.55rem);
    margin-inline-start: auto;
}
.scores-toggle {
    min-inline-size: 0;
    gap: 0.45rem;
    padding-inline: 0.68rem;
    white-space: nowrap;
    font-size: 0.82rem;
    font-weight: 750;
}
.scores-toggle[aria-expanded="true"] {
    color: var(--round-accent);
    border-color: #c8fa827d;
    background: #234634;
}
.leave-control {
    color: #ffd4ca;
}
.is-compact {
    gap: clamp(0.3rem, 1.4vw, 1.2rem);
}
.is-compact .expedition-brand {
    font-size: clamp(1rem, 2.8vw, 1.18rem);
}
</style>
