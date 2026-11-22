<template>
    <div class="lobby-code" :class="{ 'code-complete': complete, 'code-invalid': invalid, 'code-pending': readonly }" data-viewport-field>
        <label :for="id" class="sr-only">Game code</label>
        <div class="code-cells" aria-hidden="true">
            <span
                v-for="index in 4"
                :key="index"
                class="code-cell"
                :class="{ 'cell-current': caret === index - 1, 'cell-selected': index - 1 >= selection.start && index - 1 < selection.end }"
            >
                <Transition name="code-character">
                    <span v-if="code[index - 1]" :key="code[index - 1]" class="code-glyph">{{ code[index - 1] }}</span>
                </Transition>
                <span v-if="!code[index - 1]" class="code-caret" />
            </span>
        </div>
        <input
            :id="id"
            ref="field"
            class="code-native"
            type="text"
            inputmode="text"
            enterkeyhint="go"
            autocapitalize="characters"
            autocomplete="off"
            autocorrect="off"
            spellcheck="false"
            maxlength="4"
            :value="code"
            :readonly="readonly"
            :aria-invalid="invalid || undefined"
            :aria-describedby="describedby"
            @input="onInput"
            @compositionend="onInput"
            @paste.prevent="onPaste"
            @select="syncSelection"
            @focus="syncSelection"
            @keyup="syncSelection"
            @click="placeCaret"
        />
    </div>
</template>

<script setup lang="ts">
import { isLobbyCode, isPartialLobbyCode, normalizeLobbyCode, parseLobbyCode } from "~/utils/lobbyCode";

const props = defineProps<{ readonly?: boolean; invalid?: boolean; describedby?: string }>();
const code = defineModel<string>({ required: true });
const emit = defineEmits<{ error: [message: string]; edit: [] }>();
const id = useId();
const field = useTemplateRef("field");
const selection = reactive({ start: 0, end: 0 });
const complete = computed(() => isLobbyCode(code.value));
const caret = computed(() => Math.min(selection.start, 3));

function focus() {
    field.value?.focus({ preventScroll: true });
}

function blur() {
    field.value?.blur();
}

defineExpose({ focus, blur });

function syncSelection() {
    selection.start = field.value?.selectionStart ?? 0;
    selection.end = field.value?.selectionEnd ?? selection.start;
}

function placeCaret(event: MouseEvent) {
    const input = field.value;
    if (!input) return;
    if (event.detail && !event.shiftKey && input.selectionStart === input.selectionEnd) {
        const bounds = input.getBoundingClientRect();
        const position = Math.round((event.clientX - bounds.left) / (bounds.width / 4));
        const caret = Math.max(0, Math.min(position, code.value.length));
        input.setSelectionRange(caret, caret);
    }
    syncSelection();
}

function onInput(event: Event) {
    const input = event.target as HTMLInputElement;
    if ((event as InputEvent).isComposing) return;
    const value = normalizeLobbyCode(input.value);
    const position = input.selectionStart ?? value.length;
    if (!isPartialLobbyCode(value)) {
        input.value = code.value;
        input.setSelectionRange(selection.start, selection.end);
        emit("error", "Use the letters and digits from your host’s code.");
        return;
    }
    if (input.value !== value) {
        input.value = value;
        input.setSelectionRange(position, position);
    }
    code.value = value;
    emit("edit");
    syncSelection();
}

function onPaste(event: ClipboardEvent) {
    if (props.readonly) return;
    const result = parseLobbyCode(event.clipboardData?.getData("text") ?? "", window.location.origin);
    if ("error" in result) {
        emit("error", result.error);
        return;
    }
    code.value = result.code;
    if (field.value) {
        field.value.value = result.code;
        field.value.setSelectionRange(result.code.length, result.code.length);
    }
    emit("edit");
    syncSelection();
}
</script>

<style scoped>
.lobby-code {
    --cell-gap: clamp(0.3rem, 1.7vw, 0.7rem);
    --cell-width: calc((100cqw - var(--cell-gap) * 3) / 4);
    --code-font: 800 clamp(1.38rem, 5vw, 2rem) / 1 var(--gb-font-mono);
    position: relative;
    min-width: 0;
    container-type: inline-size;
}
.code-cells {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--cell-gap);
}
.code-cell {
    display: grid;
    place-items: center;
    min-height: var(--code-height, 4rem);
    border: 1px solid #c7ed8b85;
    border-radius: 0.83rem;
    background: linear-gradient(160deg, #1a443655, #041e19);
    box-shadow: inset 0 1px #cbffe019;
    color: #e2faff;
    font: var(--code-font);
    transition:
        background-color 160ms,
        border-color 160ms,
        box-shadow 160ms;
    user-select: none;
}
.code-glyph,
.code-caret {
    grid-area: 1 / 1;
}
.code-caret {
    width: 2px;
    height: 0.95em;
    border-radius: 2px;
    background: currentColor;
    color: #dcffa5;
    opacity: 0;
}
.code-character-leave-active {
    display: none;
}
.code-complete .code-cell {
    border-color: #baf39591;
}
.lobby-code:not(.code-invalid, .code-pending):focus-within .cell-current,
.lobby-code:not(.code-invalid, .code-pending):focus-within .cell-selected {
    border-color: #d7ff95;
    background: #183f29;
    box-shadow:
        0 0 0 1px #bdf37959,
        0 0 14px #a9ee5d5c,
        inset 0 0 12px #c9ff8c2e;
}
.lobby-code:not(.code-invalid, .code-pending):focus-within .cell-selected {
    background: #3b6952;
}
.lobby-code:not(.code-pending):focus-within .cell-current .code-caret {
    opacity: 1;
}
.code-invalid .code-cell {
    border-color: #f19583;
    background: #3b2523;
    box-shadow:
        inset 0 0 10px #f680663c,
        0 0 9px #f6806647;
}
.code-invalid .code-caret {
    color: #ffb5a7;
}
.code-pending .code-cell {
    border-color: #a3c68b7c;
    color: #def0e3;
}
@media (prefers-reduced-motion: no-preference) {
    .code-character-enter-active {
        animation: code-letter-in 200ms cubic-bezier(0.18, 0.7, 0.32, 1) both;
    }
    .code-cell:has(.code-character-enter-active) {
        animation: code-cell-in 230ms ease-out;
    }
}
@keyframes code-letter-in {
    from {
        opacity: 0;
        transform: translateY(0.22em) scale(0.8);
    }
    65% {
        transform: translateY(-0.04em) scale(1.06);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}
@keyframes code-cell-in {
    from {
        box-shadow: inset 0 0 14px #c9ff8c70;
    }
}
.code-native {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: 0;
    border-radius: 0.83rem;
    outline: none;
    background: transparent;
    color: transparent;
    caret-color: transparent;
    padding: 0;
    padding-inline-start: calc((var(--cell-width) - 1ch) / 2);
    font: var(--code-font);
    letter-spacing: calc(var(--cell-width) + var(--cell-gap) - 1ch);
    -webkit-text-fill-color: transparent;
    forced-color-adjust: none;
}
.code-native:focus-visible {
    outline: none;
}
.code-native::selection {
    color: transparent;
    background: transparent;
}
@media (forced-colors: active) {
    .code-cell {
        color: CanvasText;
    }
    .lobby-code:not(.code-pending):focus-within .cell-current,
    .lobby-code:not(.code-pending):focus-within .cell-selected {
        border: 2px solid Highlight;
    }
}
</style>
