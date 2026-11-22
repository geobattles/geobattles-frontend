<template>
    <UiDialog :open="guideOpen" title="Install GeoBattles" class="install-guide" @update:open="closeGuide">
        <div class="guide-content">
            <p class="guide-intro"><img src="/images/emerald-mark.svg" width="28" height="30" alt="" />More screen. Less browser.</p>
            <ol class="guide-steps" aria-label="Installation steps" role="list">
                <li v-for="step in steps" :key="step.title" class="guide-step">
                    <span class="guide-step-icon">
                        <img v-if="step.icon === 'app'" src="/icons/icon-192.png" width="32" height="32" alt="" />
                        <UiIcon v-else :name="step.icon" />
                    </span>
                    <div>
                        <h3>{{ step.title }}</h3>
                        <p>{{ step.text }}</p>
                    </div>
                </li>
            </ol>
            <p v-if="secureNote" class="guide-note">{{ secureNote }}</p>
            <footer class="guide-footer">
                <button class="btn btn-secondary copy-page" type="button" :disabled="copying" @click="copyLink">
                    <UiIcon :name="copied ? 'check' : 'copy'" />{{ copied ? "Link copied" : "Copy link" }}
                </button>
                <p class="guide-status" role="status">{{ copied ? "Current page link copied." : manualLink ? "Use your device’s Copy action on the selected link." : "" }}</p>
            </footer>
            <label v-if="manualLink" class="guide-manual">
                <span>Page link</span>
                <input ref="linkField" class="input" type="text" :value="manualLink" readonly inputmode="none" spellcheck="false" @focus="selectLink" />
            </label>
        </div>
    </UiDialog>
</template>

<script setup lang="ts">
const { environment, guideOpen, closeGuide } = usePwaInstall();
const linkField = useTemplateRef("linkField");
const copied = ref(false);
const copying = ref(false);
const manualLink = ref("");
let copyAttempt = 0;

const iosShare = { icon: "share", title: "Add to Home Screen", text: "In Safari, tap Share (sometimes in the Page Menu), then Add to Home Screen." };
const openSafari = { icon: "external", title: "Open in Safari", text: "Use Open in Browser if available, or copy this page’s link and paste it into Safari." };
const openBrowser = { icon: "external", title: "Open in your browser", text: "Use Open in Browser if available, or copy this page’s link and paste it into Chrome." };
const androidInstall = {
    icon: "install",
    title: "Install from the menu",
    text: "Look for Install app, Install and create shortcut, or Add to Home screen in the browser menu. Follow the prompts if offered.",
};
const launch = { icon: "app", title: "Launch GeoBattles", text: "Tap the GeoBattles icon on your Home Screen." };
const steps = computed(() => {
    const device = environment.value;
    if (!device) return [];
    if (device.platform === "ios") {
        if (device.browser !== "safari") {
            return [openSafari, iosShare, { ...launch, text: "Turn on Open as Web App if shown, tap Add, then launch GeoBattles from your Home Screen." }];
        }
        return [iosShare, { icon: "install", title: "Open as Web App", text: "Turn on Open as Web App if shown, then tap Add." }, launch];
    }
    if (device.platform === "android") {
        const install = device.browser === "samsung" ? { ...androidInstall, text: "Open Samsung Internet’s menu, choose Add page to, then Home screen." } : androidInstall;
        return device.browser === "embedded" ? [openBrowser, install, launch] : [install, launch];
    }
    if (device.browser === "safari") {
        return [{ ...androidInstall, title: "Add to Dock", text: "In Safari, choose File, then Add to Dock if available. Choose Add to finish." }];
    }
    if (device.browser === "chromium") {
        return [{ ...androidInstall, text: "Look for an install icon in the address bar or an Install app option in the browser menu." }];
    }
    return [{ ...openBrowser, text: "Open this page in Chrome or Edge. Look for the install option in the address bar or browser menu." }];
});
const secureNote = computed(() =>
    environment.value?.secure === false && environment.value.platform !== "ios" ? "Use a trusted HTTPS GeoBattles address if your browser doesn’t offer installation here." : ""
);

watch(guideOpen, (open) => {
    if (open) return;
    copyAttempt++;
    copied.value = false;
    copying.value = false;
    manualLink.value = "";
});

const selectLink = () => linkField.value?.select();
async function copyLink() {
    const url = window.location.href;
    const attempt = ++copyAttempt;
    copying.value = true;
    try {
        if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
        await navigator.clipboard.writeText(url);
        if (attempt !== copyAttempt) return;
        manualLink.value = "";
        copied.value = true;
    } catch {
        if (attempt !== copyAttempt) return;
        copied.value = false;
        manualLink.value = url;
        await nextTick();
        linkField.value?.focus();
        selectLink();
    } finally {
        if (attempt === copyAttempt) copying.value = false;
    }
}
</script>

<style scoped>
.install-guide {
    --dialog-gap: 0.65rem;
    width: min(43rem, calc(100% - var(--dialog-left) - var(--dialog-right)));
    border-color: #a4e9ae91;
    border-radius: 1.15rem;
    background: linear-gradient(146deg, #143d34, #071f1d 69%);
    scrollbar-width: thin;
    scroll-padding-top: 3.5rem;
}
.install-guide::backdrop {
    background: #041c18bd;
}
.install-guide :deep(.ui-dialog-inner) {
    padding: 0;
}
.install-guide :deep(.ui-dialog-header) {
    position: sticky;
    inset-block-start: 0;
    z-index: 1;
    gap: 0.5rem;
    align-items: center;
    margin: 0;
    padding: 0.42rem 0.68rem 0.42rem 0.95rem;
    border-bottom: 1px solid #b5f6c643;
    background:
        url("/images/atlas-relief.svg") right center / 26rem auto no-repeat,
        linear-gradient(108deg, #184a3d, #0b302a 74%);
}
.install-guide :deep(.ui-dialog-header h2) {
    color: #f8fcf8;
    font: italic 850 clamp(1.2rem, 3.3vw, 1.65rem) / 1.05 var(--gb-font-display);
    letter-spacing: -0.025em;
}
.install-guide :deep(.ui-dialog-header button) {
    border: 1px solid #b1e9bf55;
    border-radius: 0.72rem;
    background: #092921c9;
    color: #e6f9ec;
}
.install-guide :deep(.ui-dialog-header button:focus-visible) {
    outline-offset: -3px;
}
.guide-content {
    display: grid;
    gap: 0.7rem;
    min-width: 0;
    padding: 0.8rem clamp(0.6rem, 2.9vw, 1.25rem);
}
.guide-intro {
    display: flex;
    align-items: center;
    gap: 0.48rem;
    color: #dbf8c9;
    font-size: 0.94rem;
    font-weight: 700;
}
.guide-steps {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 11rem), 1fr));
    gap: 0.45rem;
    margin: 0;
    padding: 0;
    list-style: none;
}
.guide-step {
    display: flex;
    min-width: 0;
    gap: 0.55rem;
    align-items: flex-start;
    padding: 0.55rem;
    border: 1px solid #ace4bb47;
    border-radius: 0.8rem;
    background: linear-gradient(132deg, #65b79025, #0a2a24 92%);
}
.guide-step-icon {
    display: grid;
    flex: none;
    place-items: center;
    width: 2.18rem;
    height: 2.18rem;
    overflow: hidden;
    border: 1px solid #b3f1b561;
    border-radius: 0.64rem;
    background: #0b2d27;
    color: #d9fca6;
}
.guide-step-icon .ui-icon {
    width: 1.25rem;
    height: 1.25rem;
}
.guide-step-icon img {
    width: 100%;
    height: 100%;
}
.guide-step h3 {
    margin: 0 0 0.19rem;
    font: 800 0.88rem/1.14 var(--gb-font-display);
}
.guide-step p,
.guide-note,
.guide-status,
.guide-manual {
    color: #c7e4d8;
    font-size: 0.79rem;
    line-height: 1.35;
}
.guide-footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.3rem 0.65rem;
}
.copy-page {
    flex: none;
    min-height: 44px;
    border-color: #a9e8b987;
    border-radius: 0.7rem;
    background: #153f33;
    color: #edfbea;
    font-size: 0.8rem;
}
.guide-manual {
    display: grid;
    gap: 0.25rem;
    min-width: 0;
}
.guide-manual input {
    min-height: 44px;
    width: 100%;
    font-size: 16px;
}
@media (orientation: portrait) and (max-width: 600px) {
    .install-guide[open] {
        inset: auto var(--dialog-right) calc(var(--visible-bottom, 0px) + var(--dialog-bottom)) var(--dialog-left);
        margin: 0 auto;
    }
    .guide-steps {
        grid-template-columns: minmax(0, 1fr);
    }
}
@media (orientation: landscape) and (max-height: 475px) {
    .guide-content {
        gap: 0.42rem;
        padding: 0.5rem 0.6rem;
    }
    .guide-steps {
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 8.6rem), 1fr));
    }
    .guide-step {
        flex-direction: column;
        gap: 0.36rem;
    }
}
@media (prefers-reduced-motion: no-preference) {
    .install-guide[open]::backdrop {
        animation: install-backdrop 160ms ease-out;
    }
    @keyframes install-backdrop {
        from {
            opacity: 0;
        }
    }
}
</style>
