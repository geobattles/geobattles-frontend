<template>
    <Transition name="install-card">
        <aside v-if="visible" ref="card" class="install-promotion" :aria-labelledby="titleId" :data-placement="placement">
            <div class="install-card-inner">
                <span class="install-mark"><img src="/images/emerald-mark.svg" alt="" width="24" height="26" /></span>
                <div class="install-copy">
                    <h2 :id="titleId">{{ placement === "home" ? "Install GeoBattles" : "Enjoyed GeoBattles?" }}</h2>
                    <p>{{ placement === "home" ? "More screen. Less browser." : "Play next time as an app." }}</p>
                </div>
                <div class="install-card-actions">
                    <button class="install-action" type="button" :disabled="pending" :aria-haspopup="canPrompt ? undefined : 'dialog'" @click="requestInstall(() => ready)">
                        {{ pending ? "Opening…" : canPrompt ? "Install" : "How to install" }}
                    </button>
                    <button class="install-later" type="button" :disabled="pending" @click="dismissPromotion">Not now</button>
                </div>
            </div>
        </aside>
    </Transition>
</template>

<script setup lang="ts">
const props = defineProps<{ placement: "home" | "results"; ready: boolean; matchKey?: string }>();
const { canPrompt, pending, requestInstall, canPromote, recordPromotion, dismissPromotion } = usePwaInstall();
const titleId = useId();
const card = useTemplateRef("card");
const key = computed(() => props.matchKey ?? "");
const visible = computed(() => props.ready && canPromote(props.placement, key.value));
watch(card, (element, _previous, onCleanup) => {
    if (!element) return;
    const record = () => {
        if (visible.value) recordPromotion(props.placement, key.value);
    };
    if (!("IntersectionObserver" in window)) {
        record();
        return;
    }
    const observer = new IntersectionObserver(
        ([entry]) => {
            if (!entry || entry.intersectionRatio < 0.5 || getComputedStyle(element).visibility === "hidden") return;
            record();
            observer.disconnect();
        },
        { threshold: 0.5 }
    );
    observer.observe(element);
    onCleanup(() => observer.disconnect());
});
</script>

<style scoped>
.install-promotion {
    container-type: inline-size;
    min-width: 0;
    border: 1px solid #a4ecad59;
    border-radius: 0.95rem;
    background: linear-gradient(116deg, #19483df5, #082b25f5 55%, #0a342af5);
    box-shadow:
        inset 0 1px #d1ffc61f,
        0 0.32rem 1.05rem #031b1573;
    color: #f5faf7;
    text-align: start;
    text-shadow: none;
}
.install-promotion[data-placement="results"] {
    margin: 0.6rem 0.1rem 0.15rem;
}
:global(html:has(dialog:modal) .install-promotion) {
    visibility: hidden;
}
.install-card-inner {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.55rem;
    padding: 0.4rem 0.55rem;
}
.install-mark {
    display: grid;
    place-items: center;
    width: 2.15rem;
    height: 2.15rem;
    border: 1px solid #b1e9b64f;
    border-radius: 0.65rem;
    background: #071f1c;
}
.install-copy {
    min-width: 0;
}
.install-copy h2 {
    color: #f5faf7;
    font: 800 0.88rem/1.15 var(--gb-font-display);
}
.install-copy p {
    margin: 0.14rem 0 0;
    color: #c5e1d4;
    font: 500 0.73rem/1.2 var(--gb-font-display);
}
.install-card-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.12rem 0.3rem;
}
.install-card-actions button {
    min-height: 44px;
    padding: 0.28rem 0.65rem;
    border-radius: 0.65rem;
    font-size: 0.76rem;
    font-weight: 800;
    white-space: nowrap;
}
.install-card-actions button:disabled {
    cursor: wait;
    opacity: 0.75;
}
.install-action {
    border: 1px solid #b7ee9e;
    background: linear-gradient(125deg, #dcfbc9, #b6e99e);
    color: #143425;
    box-shadow: inset 0 1px #f4ffe4c9;
}
.install-later {
    border: 1px solid transparent;
    background: transparent;
    color: #cde8d9;
}
@media (hover: hover) {
    .install-action:enabled:hover {
        background: #e0ffcd;
    }
    .install-later:enabled:hover {
        border-color: #b3e6ae69;
        background: #84ceae21;
    }
}
@container (max-width: 26rem) {
    .install-card-inner {
        grid-template-columns: auto minmax(0, 1fr);
        gap: 0.28rem 0.5rem;
        padding: 0.4rem 0.5rem;
    }
    .install-card-actions {
        grid-column: 2;
    }
}
@media (orientation: landscape) and (max-height: 440px) {
    .install-promotion[data-placement="home"] .install-card-inner {
        grid-template-columns: auto minmax(0, 1fr) auto;
    }
    .install-promotion[data-placement="home"] .install-card-actions {
        grid-column: auto;
    }
}
@media (prefers-reduced-motion: no-preference) {
    .install-card-enter-active,
    .install-card-leave-active {
        transition:
            opacity 150ms ease,
            translate 150ms ease;
    }
    .install-card-enter-from,
    .install-card-leave-to {
        opacity: 0;
        translate: 0 0.2rem;
    }
}
</style>
