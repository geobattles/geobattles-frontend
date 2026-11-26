<template>
    <section v-if="enabled.some(Boolean)" class="powerup-choices" aria-label="Next round powerups" data-testid="powerup-choices">
        <button
            ref="entry"
            class="powerup-entry"
            type="button"
            aria-haspopup="dialog"
            :aria-controls="id"
            :aria-expanded="opened"
            :class="{ 'can-choose': windowOpen && ownDecision === false, 'compact-entry': compact }"
            @click="openSheet"
        >
            <span class="entry-icon"><UiIcon name="bolt" /></span>
            <span class="entry-copy">
                <strong>Powerups</strong>
                <small v-if="!compact || appliedSummary">{{ appliedSummary || "Use a powerup for the next round" }}</small>
            </span>
            <span class="entry-details">
                <span class="entry-state">{{ entryState }}</span>
                <span v-if="windowOpen" class="choice-time entry-time"><UiIcon name="clock" /><span class="sr-only">Choice time left </span>{{ choiceSeconds }}s</span>
            </span>
            <UiIcon name="arrow" />
        </button>
        <p class="sr-only" role="status">{{ !opened ? notice || appliedSummary : "" }}</p>
        <Teleport :to="noticeTarget || 'body'" :disabled="!compact && (!opened || !dialogNotice)">
            <GameplayDuelNotice class="queued-duel" :challengers="challengers" :round="nextRound" :floating="compact" :layer="noticeTarget" queued />
        </Teleport>

        <dialog
            :id="id"
            ref="dialog"
            class="powerup-sheet"
            :class="{ 'rival-sheet': choosingRival, 'short-viewport': shortViewport, 'rival-searching': compactSearch }"
            :style="viewportStyle"
            :aria-labelledby="`${id}-title`"
            @cancel.prevent="closeSheet"
            @close="onClosed"
            @pointerdown="rememberBackdrop"
            @click="dismissBackdrop"
        >
            <div class="sheet-shell">
                <div class="sheet-grip" aria-hidden="true" @pointerdown="startSwipe" @pointerup="endSwipe" @pointercancel="swipe = null"></div>
                <header class="sheet-header">
                    <button v-if="choosingRival" type="button" class="sheet-icon sheet-back" aria-label="Back to powerups" @click="showPowerups"><UiIcon name="arrow" /></button>
                    <span v-else class="sheet-symbol"><UiIcon name="bolt" /></span>
                    <div class="sheet-heading">
                        <h2 :id="`${id}-title`" ref="heading" tabindex="-1">{{ choosingRival ? "Challenge a Rival" : "Powerups" }}</h2>
                        <p v-if="choosingRival">Choose a player to face in the next round.</p>
                        <p v-else>Choose an advantage for round {{ nextRound }}.</p>
                    </div>
                    <span v-if="windowOpen" class="choice-time"><UiIcon name="clock" /><span class="sr-only">Choice time left </span>{{ choiceSeconds }}s</span>
                    <button type="button" class="sheet-icon" autofocus aria-label="Close powerups" @click="closeSheet"><UiIcon name="close" /></button>
                </header>
                <div ref="dialogNotice" class="dialog-duel-slot" />

                <form v-if="choosingRival" :id="`${id}-form`" class="rival-body" @submit.prevent="confirmRival">
                    <div class="rival-tools">
                        <label class="rival-search" data-viewport-field>
                            <UiIcon name="search" />
                            <span class="sr-only">Search players</span>
                            <input v-model="search" type="search" placeholder="Search players…" autocomplete="off" enterkeyhint="search" @keydown.enter.prevent="finishEditing" />
                        </label>
                        <UiKeyboardDone v-if="compactSearch" @click="finishEditing" />
                        <span v-if="compactSearch && windowOpen" class="choice-time"
                            ><UiIcon name="clock" /><span class="sr-only">Choice time left </span>{{ choiceSeconds }}s</span
                        >
                    </div>
                    <fieldset class="rival-list" tabindex="0">
                        <legend class="sr-only">Choose an opponent</legend>
                        <label v-for="rival in filteredRivals" :key="rival.id" class="rival-row">
                            <input v-model="target" class="sr-only" type="radio" :name="`${id}-rival`" :value="rival.id" :disabled="!rival.player.connected || !canUse(1)" />
                            <PlayerAvatar :color="rival.player.color" />
                            <span class="rival-identity">
                                <strong>{{ rival.player.name }}</strong>
                                <small v-if="!rival.player.connected">Disconnected</small>
                                <small v-else-if="rival.standing">{{ rival.standing.score }} pts</small>
                            </span>
                            <span v-if="rival.standing" class="rival-rank" :data-rank="rival.standing.rank"><span class="sr-only">Rank </span>{{ rival.standing.rank }}</span>
                            <span class="rival-check" aria-hidden="true"><UiIcon v-if="target === rival.id" name="check" /></span>
                        </label>
                        <p v-if="!filteredRivals.length" class="sheet-empty">{{ search.trim() ? "No players match your search." : "No rivals available." }}</p>
                    </fieldset>
                </form>

                <div v-else class="powerup-body">
                    <p class="sr-only" role="status">{{ appliedSummary }}</p>
                    <div class="powerup-cards">
                        <button
                            v-for="item in items"
                            :key="item.type"
                            type="button"
                            class="powerup-card"
                            :class="{ 'duel-card': item.type === 1, 'is-confirmed': effectFor(item.type) }"
                            :disabled="!canUse(item.type)"
                            @click="choose(item.type)"
                        >
                            <span class="card-art"><GameplayPowerupArtwork :type="item.type" /></span>
                            <span class="card-copy">
                                <strong>{{ item.name }}</strong>
                                <small>{{ item.description }}</small>
                                <span v-if="cardStatus(item.type)" class="card-status"> <UiIcon v-if="effectFor(item.type)" name="check" />{{ cardStatus(item.type) }} </span>
                            </span>
                            <UiIcon v-if="canUse(item.type)" class="card-next" name="arrow" />
                        </button>
                    </div>
                </div>

                <footer v-if="choosingRival || notice || pending?.uncertain" class="sheet-footer">
                    <p v-if="notice || rivalNote" class="sheet-notice" role="status">{{ notice || rivalNote }}</p>
                    <button v-if="pending?.uncertain" type="button" class="sheet-confirm" :disabled="!online" @click="emit('retry')">
                        Retry same request <UiIcon name="refresh" />
                    </button>
                    <button
                        v-else-if="choosingRival"
                        type="submit"
                        :form="`${id}-form`"
                        class="sheet-confirm"
                        :aria-busy="!!pending"
                        :disabled="!selectedRival?.connected || !canUse(1)"
                    >
                        <span v-if="pending" class="spinner" aria-hidden="true" />
                        <span>{{ pending ? "Sending challenge…" : selectedRival ? `Challenge ${selectedRival.name}` : "Choose a rival" }}</span>
                        <UiIcon v-if="!pending" name="arrow" />
                    </button>
                </footer>
            </div>
        </dialog>
    </section>
</template>

<script setup lang="ts">
import GameplayPowerupArtwork from "./PowerupArtwork.vue";
import PlayerAvatar from "~/components/Ui/PlayerAvatar.vue";
import type { LobbyInfo } from "~/types/appTypes";
import type { PowerupPending, PowerupType } from "~/types/powerups";
import type { RankedResult } from "~/utils/resultUtils";
import { duelStake, roundPowerupEffects } from "~/utils/roundPowerups";

const props = defineProps<{
    snapshot: LobbyInfo;
    playerId: string;
    standings: RankedResult[];
    remainingMs: number;
    pending: PowerupPending | null;
    feedback: string;
    online: boolean;
    startPending: boolean;
    compact?: boolean;
}>();
const emit = defineEmits<{ use: [type: PowerupType, target?: string]; retry: [] }>();
const enabled = computed(() => props.snapshot.conf.powerups ?? []);
const state = computed(() => props.snapshot.powerupState);
const ownDecision = computed(() => state.value?.decisionReady[props.playerId]);
const nextRound = computed(() => props.snapshot.currentRound + 1);
const windowOpen = computed(() => Boolean(props.snapshot.phase === "MID-ROUND" && state.value?.status === "OPEN" && !state.value.starting && props.remainingMs > 0));
const choiceSeconds = computed(() => Math.ceil(props.remainingMs / 1000));
const duelRule = computed(() => `${props.snapshot.conf.mode === 2 ? "Faster correct country" : "Closer guess"} wins ${duelStake} points.`);
const items = computed(() => [
    { type: 0 as const, name: "Double your score", description: "Double your base points in the next round." },
    { type: 1 as const, name: "Challenge a rival", description: duelRule.value },
]);
const standings = computed(() => new Map(props.standings.map((row) => [row.id, row])));
const rivals = computed(() =>
    Object.entries(props.snapshot.playerList)
        .filter(([id]) => id !== props.playerId)
        .map(([id, player]) => ({ id, player, standing: standings.value.get(id) }))
        .sort(
            (a, b) =>
                Number(b.player.connected) - Number(a.player.connected) ||
                (a.standing?.rank ?? Infinity) - (b.standing?.rank ?? Infinity) ||
                a.player.name.localeCompare(b.player.name)
        )
);
const rivalName = (id?: string) => (id ? props.snapshot.playerList[id]?.name : undefined) ?? "Another player";
const hasRival = computed(() => rivals.value.some(({ player }) => player.connected));
const nextEffects = computed(() => roundPowerupEffects(props.snapshot, nextRound.value, "QUEUED"));
const challengers = computed(() => nextEffects.value.filter((effect) => effect.type === 1 && effect.target === props.playerId).map((effect) => rivalName(effect.source)));
const confirmed = computed(() => nextEffects.value.filter((effect) => effect.source === props.playerId));
const effectFor = (type: PowerupType) => confirmed.value.find((effect) => effect.type === type);
const appliedSummary = computed(() => {
    const duel = effectFor(1);
    return [effectFor(0) ? "Double Score queued" : "", duel ? `Duel with ${rivalName(duel.target)}` : ""].filter(Boolean).join(" · ");
});
const pendingType = computed(() => (props.pending?.message.command === "use_powerup" ? props.pending.message.powerup.type : undefined));
const canUse = (type: PowerupType) =>
    !!(
        windowOpen.value &&
        ownDecision.value === false &&
        props.online &&
        !props.pending &&
        !props.startPending &&
        enabled.value[type] &&
        props.snapshot.playerList[props.playerId]?.powerups?.[type] === true &&
        !effectFor(type) &&
        (type === 0 || hasRival.value)
    );
const entryState = computed(() => {
    if (props.pending) return props.pending.uncertain ? "Retry" : "Sending…";
    if (!state.value || !props.online) return "Unavailable";
    if (!windowOpen.value || ownDecision.value === true) return "Locked";
    if (confirmed.value.length) return "Selected";
    return items.value.some(({ type }) => canUse(type)) ? "Choose" : "Unavailable";
});
const cardStatus = (type: PowerupType) => {
    const effect = effectFor(type);
    if (effect) return type === 0 ? "Confirmed" : `Confirmed · ${rivalName(effect.target)}`;
    if (pendingType.value === type) return props.pending?.uncertain ? "Unconfirmed" : "Sending…";
    if (!enabled.value[type]) return "Off in settings";
    if (!state.value) return "Unavailable on this server";
    if (props.snapshot.playerList[props.playerId]?.powerups?.[type] !== true) return "Unavailable";
    if (!props.online) return "Waiting for connection";
    if (!windowOpen.value || ownDecision.value === true || props.startPending) return "Choices locked";
    if (type === 1 && !hasRival.value) return "No connected rivals";
    if (props.pending) return "Awaiting confirmation";
    return ownDecision.value === false ? "" : "Unavailable";
};
const notice = computed(() => {
    if (props.pending?.uncertain) return "Choice unconfirmed. Retry to check the same request.";
    if (props.pending) return "Waiting for server confirmation…";
    // A queued card already confirms a successful spend. Keep the footer
    // available for feedback about the choice currently being made.
    return props.feedback === `Confirmed for round ${nextRound.value}.` ? "" : props.feedback;
});

const id = useId();
const entry = useTemplateRef("entry");
const dialog = useTemplateRef("dialog");
const dialogNotice = useTemplateRef("dialogNotice");
const heading = useTemplateRef("heading");
const opened = ref(false);
const fullscreenTarget = shallowRef<Element | null>(null);
const noticeTarget = computed(() => (opened.value && dialogNotice.value ? dialogNotice.value : fullscreenTarget.value));
const syncFullscreenTarget = () => (fullscreenTarget.value = document.fullscreenElement);
onMounted(() => {
    syncFullscreenTarget();
    document.addEventListener("fullscreenchange", syncFullscreenTarget);
});
onBeforeUnmount(() => document.removeEventListener("fullscreenchange", syncFullscreenTarget));
const choosingRival = ref(false);
const search = ref("");
const target = ref("");
const selectedRival = computed(() => (target.value ? props.snapshot.playerList[target.value] : undefined));
const rivalNote = computed(() => {
    if (target.value && !selectedRival.value?.connected) return "This rival is no longer available.";
    return !canUse(1) ? cardStatus(1) : "";
});
const filteredRivals = computed(() => {
    const query = search.value.trim().toLocaleLowerCase();
    return query ? rivals.value.filter(({ player }) => player.name.toLocaleLowerCase().includes(query)) : rivals.value;
});
const focusHeading = async () => {
    await nextTick();
    if (dialog.value?.open) heading.value?.focus({ preventScroll: true });
};
const showPowerups = () => {
    choosingRival.value = false;
    void focusHeading();
};
const choose = (type: PowerupType) => {
    if (!canUse(type)) return;
    if (type === 0) emit("use", 0);
    else {
        choosingRival.value = true;
        void focusHeading();
    }
};
const confirmRival = () => {
    if (canUse(1) && target.value && target.value !== props.playerId && selectedRival.value?.connected) emit("use", 1, target.value);
};
watch(
    () => effectFor(1)?.id,
    (effect) => {
        if (effect && choosingRival.value && effectFor(1)?.target === target.value) showPowerups();
    }
);

const viewportStyle = useViewportFit(() => opened.value);
const { measurements } = useMobileViewport();
const { visibleHeight, editingHeightLoss, finishEditing } = useViewportForm(dialog);
const shortViewport = computed(() => (measurements.value?.layoutHeight ?? Infinity) < 325 || (editingHeightLoss.value >= 64 && visibleHeight.value < 325));
const compactSearch = computed(() => choosingRival.value && editingHeightLoss.value >= 64 && visibleHeight.value < 245);
watch(opened, (open, _, onCleanup) => {
    if (!open) return;
    document.addEventListener("fullscreenchange", closeSheet);
    onCleanup(() => document.removeEventListener("fullscreenchange", closeSheet));
});
const openSheet = () => {
    if (!dialog.value || dialog.value.open || props.snapshot.phase !== "MID-ROUND") return;
    dialog.value.showModal();
    opened.value = true;
};
const closeSheet = () => {
    dialog.value?.close();
    opened.value = false;
};
const onClosed = () => {
    if (dialog.value?.open) return;
    opened.value = false;
    choosingRival.value = false;
    search.value = "";
    target.value = "";
    if (entry.value?.getClientRects().length) entry.value.focus({ preventScroll: true });
};
let fromBackdrop = false;
const rememberBackdrop = (event: PointerEvent) => {
    fromBackdrop = event.target === dialog.value;
};
const dismissBackdrop = (event: MouseEvent) => {
    const sheet = dialog.value;
    if (!fromBackdrop || !sheet || event.target !== sheet) return;
    const bounds = sheet.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeSheet();
};
let swipe: { id: number; y: number } | null = null;
const startSwipe = (event: PointerEvent) => {
    if (event.pointerType !== "touch" || !(event.currentTarget instanceof HTMLElement)) return;
    swipe = { id: event.pointerId, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
};
const endSwipe = (event: PointerEvent) => {
    if (swipe?.id === event.pointerId && event.clientY - swipe.y > 56) closeSheet();
    swipe = null;
};
onBeforeUnmount(closeSheet);
</script>

<style scoped>
.powerup-choices {
    min-width: 0;
}
.powerup-entry {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto auto;
    align-items: center;
    gap: clamp(0.35rem, 1.4vw, 0.8rem);
    width: 100%;
    min-height: 48px;
    padding: 0.32rem clamp(0.45rem, 1.2vw, 0.9rem);
    border: 1px solid #f2cc87a6;
    border-radius: 0.78rem;
    background: radial-gradient(ellipse at 0 0, #8a612a75, transparent 55%), linear-gradient(145deg, #474031, #222a23);
    box-shadow:
        inset 0 0 10px #ffc56926,
        0 2px 9px #00161362;
    color: #fff5dc;
    text-align: start;
}
.powerup-entry:hover,
.powerup-entry[aria-expanded="true"] {
    border-color: #ffe2a0;
    box-shadow:
        inset 0 0 15px #ffc5694f,
        0 3px 10px #00161362;
}
.entry-icon {
    display: grid;
    place-items: center;
    width: clamp(1.75rem, 5vw, 2.55rem);
    aspect-ratio: 1;
    border: 1px solid #ffd58364;
    border-radius: 50%;
    background: linear-gradient(140deg, #99703dcb, #564325);
    color: #ffe0a1;
}
.entry-icon .ui-icon,
.sheet-symbol .ui-icon {
    fill: currentColor;
}
.entry-copy {
    display: grid;
    min-width: 0;
    line-height: 1.18;
}
.entry-copy strong {
    font: italic 810 clamp(0.95rem, 2vw, 1.22rem) / 1.2 var(--gb-font-display);
}
.entry-copy small {
    overflow: hidden;
    color: #f0dfc4;
    font-size: clamp(0.65rem, 1.75vw, 0.82rem);
    text-overflow: ellipsis;
    white-space: nowrap;
}
.entry-state {
    padding: 0.18rem 0.42rem;
    border-radius: 999px;
    background: #ffcf7930;
    color: #ffebc1;
    font-size: clamp(0.62rem, 1.8vw, 0.77rem);
    font-weight: 750;
    white-space: nowrap;
}
.entry-details {
    display: flex;
    align-items: center;
    gap: 0.35rem;
}
.entry-details .entry-time {
    color: #fff0ce;
    background: #ffcf7928;
    white-space: nowrap;
}
.compact-entry {
    gap: 0.4rem;
    min-height: 44px;
    padding: 0.25rem 0.43rem;
    border-color: #f2cc877d;
    border-radius: 0.7rem;
    background: linear-gradient(115deg, #594a2f, #27352a 85%);
    box-shadow: inset 0 1px #ffe3a61a;
}
.compact-entry .entry-icon {
    width: clamp(1.45rem, 4vw, 1.82rem);
}
.compact-entry .entry-copy strong {
    font-size: clamp(0.84rem, 2.4vw, 1.02rem);
}
.compact-entry .entry-state {
    font-size: 0.7rem;
}
.compact-entry > .ui-icon {
    font-size: 0.83rem;
}
@media (orientation: portrait) and (max-width: 475px) {
    .compact-entry {
        grid-template-columns: auto minmax(0, 1fr) auto;
        grid-template-rows: auto auto;
        row-gap: 0;
    }
    .compact-entry .entry-icon {
        grid-area: 1 / 1 / 3;
    }
    .compact-entry .entry-copy {
        grid-area: 1 / 2;
    }
    .compact-entry .entry-copy small {
        @apply sr-only;
    }
    .compact-entry .entry-details {
        grid-area: 2 / 2 / 3 / 4;
        flex-wrap: wrap;
        row-gap: 0.15rem;
    }
    .compact-entry .entry-state {
        padding: 0;
        background: transparent;
        line-height: 1.12;
    }
    .compact-entry .entry-time {
        padding: 0 0.3rem;
        line-height: 1.2;
    }
    .compact-entry > .ui-icon {
        grid-area: 1 / 3;
    }
}
.powerup-sheet {
    --sheet-gap: 0.65rem;
    --sheet-vh: var(--visible-height, var(--gb-viewport-height));
    --sheet-edge: max(var(--sheet-gap), var(--gb-safe-left), var(--gb-safe-right));
    position: fixed;
    inset: calc(var(--visible-top, 0px) + var(--sheet-vh) / 2) auto auto 50%;
    width: min(36rem, calc(100% - 2 * var(--sheet-edge)));
    max-width: none;
    max-height: calc(var(--sheet-vh) - max(var(--sheet-gap), var(--gb-safe-top)) - max(var(--sheet-gap), var(--gb-safe-bottom)));
    margin: 0;
    padding: 0;
    overflow: hidden;
    transform: translate(-50%, -50%);
    border: 1px solid #b7ed9b83;
    border-radius: 1.35rem;
    background:
        url("/images/atlas-relief.svg") center bottom / 32rem auto no-repeat,
        linear-gradient(155deg, #174437, #082b23 62%, #09291f);
    box-shadow:
        inset 0 1px #efffcb4d,
        0 0.75rem 3rem #001510a6;
    color: #f5faf6;
}
.powerup-sheet::backdrop {
    background: #001814ae;
}
.rival-sheet {
    height: min(34rem, calc(var(--sheet-vh, 100dvh) - var(--sheet-gap) * 2));
}
.sheet-shell {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    max-height: inherit;
    padding: 0.68rem;
}
.rival-sheet .sheet-shell {
    height: 100%;
}
.sheet-grip {
    display: none;
}
.sheet-header {
    display: flex;
    align-items: center;
    flex: none;
    min-width: 0;
    gap: clamp(0.36rem, 1.8vw, 0.75rem);
    padding-inline-start: 0.25rem;
}
.sheet-icon {
    display: grid;
    place-items: center;
    flex: none;
    width: 44px;
    height: 44px;
    border: 1px solid #add6a847;
    border-radius: 0.7rem;
    background: #133d31;
}
.sheet-icon:hover {
    border-color: #d7fba2;
}
.sheet-back .ui-icon {
    transform: rotate(180deg);
}
.sheet-symbol {
    flex: none;
    color: #ffe098;
    font-size: 1.55rem;
}
.sheet-heading {
    flex: 1;
    min-width: 0;
}
.sheet-heading h2 {
    font: italic 830 clamp(1.06rem, 3.4vw, 1.55rem) / 1.15 var(--gb-font-display);
}
.sheet-heading p {
    margin-block-start: 0.15rem;
    color: #cee4d8;
    font-size: clamp(0.69rem, 1.95vw, 0.85rem);
    line-height: 1.25;
}
.choice-time {
    display: inline-flex;
    flex: none;
    align-items: center;
    gap: 0.33em;
    border-radius: 999px;
    padding: 0.2rem 0.46rem;
    background: #bff17a1d;
    color: #e6ffc1;
    font-size: clamp(0.72rem, 2vw, 0.86rem);
    font-weight: 750;
    font-variant-numeric: tabular-nums;
}
.powerup-body {
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
}
.powerup-cards {
    display: grid;
    gap: 0.55rem;
}
.powerup-card {
    --card-accent: #cef88d;
    display: grid;
    grid-template-columns: 5.1rem minmax(0, 1fr) auto;
    align-items: center;
    gap: clamp(0.48rem, 2.5vw, 0.95rem);
    min-width: 0;
    min-height: 68px;
    padding: 0.55rem 0.65rem;
    border: 1px solid #c7f786ab;
    border-radius: 0.85rem;
    background: radial-gradient(ellipse at 12% 3%, #638b3d78, transparent 76%), linear-gradient(140deg, #234d30, #103327);
    box-shadow: inset 0 0 15px #bbf77f36;
    color: #f8fdf6;
    text-align: start;
}
.duel-card {
    --card-accent: #ffc1c5;
    border-color: #e6a2adab;
    background: radial-gradient(ellipse at 16% 0, #a55d747d, transparent 78%), linear-gradient(141deg, #5f3848, #2c2330);
    box-shadow: inset 0 0 15px #f596a82b;
}
.powerup-card:enabled:hover,
.powerup-card.is-confirmed {
    border-color: var(--card-accent);
}
.powerup-card:disabled:not(.is-confirmed) {
    border-color: #adc6af4f;
    background: #15382c;
    box-shadow: none;
    color: #cbded2;
}
.powerup-card:disabled:not(.is-confirmed) .card-art {
    opacity: 0.55;
}
.card-art :deep(.powerup-art) {
    width: 100%;
    height: auto;
}
.card-copy {
    display: grid;
    gap: 0.14rem;
    min-width: 0;
}
.card-copy strong {
    font: italic 830 clamp(0.94rem, 2.5vw, 1.16rem) / 1.15 var(--gb-font-display);
}
.card-copy small,
.card-status {
    font-size: clamp(0.71rem, 2vw, 0.85rem);
    line-height: 1.25;
}
.card-status {
    display: flex;
    align-items: center;
    gap: 0.25em;
    color: var(--card-accent);
    font-weight: 700;
    overflow-wrap: anywhere;
}
.card-next {
    color: var(--card-accent);
}
.powerup-choices > .queued-duel:not(:empty) {
    margin-block-start: 0.32rem;
}
.dialog-duel-slot {
    display: contents;
}
.rival-body {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    flex: 1;
    min-height: 0;
    gap: 0.4rem;
}
.rival-tools {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    min-width: 0;
}
.rival-search {
    display: flex;
    flex: 1;
    min-width: 0;
    align-items: center;
    gap: 0.45rem;
    min-height: 44px;
    padding-inline: 0.65rem;
    border: 1px solid #a4d5b57d;
    border-radius: 0.6rem;
    background: #082d25;
    color: #dbeee7;
}
.rival-search:focus-within {
    border-color: #d2ff9d;
    outline: 1px solid #d2ff9d;
}
.rival-search input {
    width: 100%;
    min-width: 0;
    padding: 0;
    border: 0;
    outline: none;
    background: transparent;
    color: inherit;
    font-size: 16px;
}
.rival-search input::placeholder {
    color: #b4ccc0;
}
.rival-list {
    display: grid;
    align-content: start;
    gap: 0.28rem;
    min-width: 0;
    min-height: 0;
    padding: 0.16rem;
    border: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-width: thin;
}
.rival-row {
    --player-avatar-size: 1.9rem;
    position: relative;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto 1.35rem;
    align-items: center;
    min-height: 44px;
    gap: 0.5rem;
    padding: 0.26rem 0.5rem;
    border: 1px solid #93cbb249;
    border-radius: 0.65rem;
    background: #0d392e;
    cursor: pointer;
}
.rival-row:has(input:checked) {
    border-color: #d4fa9c;
    background: linear-gradient(155deg, #33583c, #10392b);
    box-shadow: inset 0 0 10px #cbff8b28;
}
.rival-row:has(input:focus-visible) {
    outline: 2px solid #d4fa9c;
    outline-offset: -2px;
}
.rival-row:has(input:disabled) {
    color: #b5cfc2;
    cursor: default;
}
.rival-identity {
    display: grid;
    min-width: 0;
    font-size: 0.88rem;
    line-height: 1.15;
}
.rival-identity strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.rival-identity small {
    color: #cbdfd4;
    font-size: 0.72rem;
}
.rival-rank {
    font: 740 0.84rem / 1.2 var(--gb-font-mono);
    color: #daeeca;
}
.rival-rank[data-rank="1"] {
    color: #ffe18d;
}
.rival-rank[data-rank="2"] {
    color: #deebef;
}
.rival-rank[data-rank="3"] {
    color: #ffba91;
}
.rival-check {
    grid-column: 4;
    display: grid;
    place-items: center;
    width: 1.22rem;
    aspect-ratio: 1;
    border: 1px solid #b5d3b479;
    border-radius: 50%;
    font-size: 0.78rem;
}
.rival-row:has(input:checked) .rival-check {
    border-color: #d7fc9f;
    background: #d7fc9f;
    color: #082a19;
}
.sheet-footer {
    display: grid;
    flex: none;
    gap: 0.35rem;
}
.sheet-empty,
.sheet-notice {
    color: #e2efdf;
    text-align: center;
    font-size: 0.77rem;
    line-height: 1.3;
}
.sheet-empty {
    padding: 0.65rem;
}
.sheet-confirm {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.52rem;
    min-width: 0;
    min-height: 46px;
    padding: 0.3rem 0.65rem;
    border: 1px solid #caff9c;
    border-radius: 999px;
    background: var(--recap-action-fill, var(--gb-scenic-action-fill));
    color: var(--gb-scenic-action-ink);
    font: italic 830 1rem / 1.2 var(--gb-font-display);
}
.sheet-confirm span:not(.spinner) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.sheet-confirm :is(.ui-icon, .spinner) {
    flex: none;
}
.sheet-confirm:disabled {
    border-color: #a6ceac63;
    background: #264637;
    color: #d8ecdc;
}
@media (orientation: portrait) and (max-width: 850px) {
    .powerup-sheet {
        inset: auto 0 var(--visible-bottom, 0px);
        width: 100%;
        transform: none;
        border-radius: 1.35rem 1.35rem 0 0;
    }
    .rival-sheet {
        height: min(34rem, calc(var(--sheet-vh, 100dvh) * 0.89));
    }
    .sheet-shell {
        gap: 0.44rem;
        padding: 0 max(0.62rem, env(safe-area-inset-right)) max(0.62rem, env(safe-area-inset-bottom)) max(0.62rem, env(safe-area-inset-left));
    }
    .sheet-grip {
        display: grid;
        place-items: center;
        flex: none;
        height: 1rem;
        touch-action: none;
    }
    .sheet-grip::before {
        width: 2.35rem;
        height: 0.21rem;
        border-radius: 1rem;
        background: #c9e2ce;
        content: "";
    }
}
@media (orientation: landscape), (min-width: 851px) {
    .powerup-cards {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .powerup-card {
        grid-template-columns: minmax(0, 1fr);
        justify-items: center;
        text-align: center;
    }
    .card-art {
        width: min(100%, 7.6rem);
    }
    .card-status {
        justify-content: center;
    }
    .card-next {
        display: none;
    }
}
@media (max-height: 420px) and (orientation: landscape) {
    .sheet-heading p {
        display: none;
    }
    .sheet-shell {
        gap: 0.38rem;
        padding: 0.48rem;
    }
}
.short-viewport .sheet-heading p,
.short-viewport .sheet-grip {
    display: none;
}
.short-viewport .sheet-shell {
    gap: 0.28rem;
    padding-block: 0.32rem;
}
.short-viewport.rival-sheet {
    height: calc(var(--sheet-vh, 100dvh) - var(--sheet-gap));
}
@media (orientation: landscape) {
    .short-viewport .rival-body {
        grid-template-columns: minmax(8rem, 0.64fr) minmax(0, 1fr);
        grid-template-rows: minmax(0, 1fr);
    }
    .short-viewport .rival-tools {
        align-self: start;
    }
}
.rival-searching .rival-body {
    grid-template: auto minmax(0, 1fr) / minmax(0, 1fr);
}
.rival-searching :is(.sheet-header, .sheet-footer) {
    display: none;
}
@media (prefers-reduced-motion: no-preference) {
    .can-choose .entry-icon {
        animation: powerup-ready 590ms ease-out;
    }
    .powerup-sheet[open] {
        animation: sheet-in 240ms ease-out;
    }
    .powerup-sheet[open]::backdrop {
        animation: sheet-dim 200ms ease-out;
    }
    .powerup-sheet[open] :is(.powerup-body, .rival-body) {
        animation: sheet-step 160ms ease-out;
    }
    .is-confirmed .card-status {
        animation: sheet-step 180ms ease-out;
    }
    @keyframes powerup-ready {
        40% {
            box-shadow: 0 0 13px #ffd472c2;
            scale: 1.09;
        }
    }
    @keyframes sheet-in {
        from {
            opacity: 0;
            translate: 0 1.25rem;
        }
    }
    @keyframes sheet-dim {
        from {
            opacity: 0;
        }
    }
    @keyframes sheet-step {
        from {
            opacity: 0.55;
            translate: 0 0.24rem;
        }
    }
}
</style>
