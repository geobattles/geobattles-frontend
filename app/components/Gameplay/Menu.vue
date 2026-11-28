<template>
    <header class="expedition-topbar" :class="{ 'is-compact': compact }">
        <span v-if="!compact" class="expedition-brand"
            ><img src="/images/emerald-mark.svg" width="30" height="32" alt="GeoBattles" /><span aria-hidden="true">Geo<b>Battles</b></span></span
        >
        <slot />
        <div v-if="!compact" class="expedition-actions" aria-label="Game controls">
            <button
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
            <GameplayEndMatchControl phase="PLAYING" />
            <button class="hud-button leave-control" type="button" aria-label="Leave lobby" title="Leave lobby" @click="emit('leaveLobbyClicked')">
                <UiIcon name="leave" />
            </button>
        </div>
        <div v-else ref="overflowRoot" class="compact-overflow" aria-label="Game controls">
            <button
                ref="overflowTrigger"
                class="hud-button compact-menu-trigger"
                type="button"
                aria-label="Game menu"
                title="Game menu"
                aria-haspopup="menu"
                :aria-expanded="menuOpen"
                :aria-controls="menuId"
                @click="menuOpen = !menuOpen"
            >
                <UiIcon :name="menuOpen ? 'close' : 'menu'" />
            </button>
            <div v-show="menuOpen" :id="menuId" class="compact-menu-popover" role="menu" aria-label="Game options">
                <button v-if="ui.fullscreenAvailable" class="compact-menu-item" type="button" role="menuitem" @click="toggleFullscreen">
                    <UiIcon :name="ui.isFullscreen ? 'shrink' : 'fullscreen'" />
                    <span>{{ ui.isFullscreen ? "Exit fullscreen" : "Fullscreen" }}</span>
                </button>
                <button v-if="canReturnToStart" class="compact-menu-item" type="button" role="menuitem" @click="returnToStart">
                    <UiIcon name="refresh" />
                    <span>Return to start</span>
                </button>
                <button
                    v-if="endMatch?.available"
                    class="compact-menu-item compact-menu-end"
                    type="button"
                    role="menuitem"
                    aria-haspopup="dialog"
                    aria-label="End match early"
                    :disabled="endMatch.disabled"
                    @click="openEndMatch"
                >
                    <UiIcon name="flag" />
                    <span>End match early</span>
                </button>
                <button class="compact-menu-item compact-menu-leave" type="button" role="menuitem" aria-label="Leave lobby" @click="leaveLobby">
                    <UiIcon name="leave" />
                    <span>Leave lobby</span>
                </button>
            </div>
            <GameplayEndMatchControl ref="endMatch" phase="PLAYING" headless />
        </div>
    </header>
</template>
<script setup lang="ts">
const props = defineProps<{ players: number; scoresOpen: boolean; scoreboardId: string; compact: boolean; canReturnToStart?: boolean }>();
const emit = defineEmits<{ leaveLobbyClicked: []; toggleScores: []; returnToStart: [] }>();
const ui = useUIManagerStore();
const scoresToggle = useTemplateRef("scoresToggle");
const overflowRoot = useTemplateRef("overflowRoot");
const overflowTrigger = useTemplateRef("overflowTrigger");
const endMatch = useTemplateRef<{ open: () => void; available: boolean; disabled: boolean }>("endMatch");
const menuId = useId();
const menuOpen = ref(false);

const closeMenu = (restoreFocus = false) => {
    if (!menuOpen.value) return;
    menuOpen.value = false;
    if (restoreFocus) overflowTrigger.value?.focus({ preventScroll: true });
};
const toggleFullscreen = () => {
    closeMenu();
    void ui.toggleFullscreen();
};
const returnToStart = () => {
    closeMenu();
    emit("returnToStart");
};
const openEndMatch = () => {
    closeMenu();
    endMatch.value?.open();
};
const leaveLobby = () => {
    closeMenu();
    emit("leaveLobbyClicked");
};

const onOutsidePointer = (event: PointerEvent) => {
    if (!menuOpen.value) return;
    const target = event.target;
    if (target instanceof Node && !overflowRoot.value?.contains(target)) closeMenu();
};
const onMenuKeydown = (event: KeyboardEvent) => {
    if (menuOpen.value && event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeMenu(true);
    }
};
watch(
    () => props.compact,
    (compact) => {
        if (!compact) menuOpen.value = false;
    }
);
onMounted(() => {
    document.addEventListener("pointerdown", onOutsidePointer, true);
    document.addEventListener("keydown", onMenuKeydown, true);
});
onBeforeUnmount(() => {
    document.removeEventListener("pointerdown", onOutsidePointer, true);
    document.removeEventListener("keydown", onMenuKeydown, true);
});
defineExpose({ focusScores: () => scoresToggle.value?.focus({ preventScroll: true }), closeMenu });
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
.expedition-topbar.is-compact {
    block-size: auto;
    min-block-size: var(--hud-header);
    align-items: center;
    gap: 0.4rem;
    padding: max(0.45rem, env(safe-area-inset-top)) var(--hud-right) 0.2rem var(--hud-left);
    border-block-end: 0;
    background: none;
    box-shadow: none;
    pointer-events: none;
}
.compact-overflow {
    position: relative;
    flex: none;
    pointer-events: auto;
}
.compact-menu-trigger {
    border-radius: 999px !important;
    min-inline-size: 42px;
    min-block-size: 42px;
    border-color: #b6efa35a !important;
    background: linear-gradient(140deg, #09322ae0, #051f1be8) !important;
    box-shadow:
        0 5px 16px #0016117a,
        inset 0 1px #dff9cf24;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
}
.compact-menu-trigger[aria-expanded="true"] {
    border-color: #d5fa86aa !important;
    color: var(--round-accent);
}
.compact-menu-popover {
    position: absolute;
    z-index: 30;
    inset-block-start: calc(100% + 0.42rem);
    inset-inline-end: 0;
    min-inline-size: 11.75rem;
    display: grid;
    gap: 0.16rem;
    padding: 0.34rem;
    border: 1px solid #b6efa368;
    border-radius: 1rem;
    background: linear-gradient(155deg, #0a342bf2, #051e1af7);
    box-shadow:
        0 12px 30px #00140fa6,
        inset 0 1px #e2ffd02a;
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
}
.compact-menu-item {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    inline-size: 100%;
    min-block-size: 42px;
    padding: 0.45rem 0.7rem;
    border: 0;
    border-radius: 0.7rem;
    background: transparent;
    color: #edf9ef;
    font-size: 0.84rem;
    font-weight: 700;
    text-align: start;
    white-space: nowrap;
}
.compact-menu-item:hover {
    background: #ffffff14;
}
.compact-menu-end {
    color: #ffdd9e;
}
.compact-menu-end:enabled:hover {
    background: #ffca6224;
}
.compact-menu-end:disabled {
    opacity: 0.5;
}
.compact-menu-leave {
    margin-block-start: 0.14rem;
    padding-block-start: 0.52rem;
    border-block-start: 1px solid #b6efa32b;
    border-start-start-radius: 0;
    border-start-end-radius: 0;
    color: #ffbeb3;
}
.compact-menu-leave:hover {
    background: #ff998924;
}
</style>
