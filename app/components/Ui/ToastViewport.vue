<template>
    <Teleport v-if="target" :to="target">
        <TransitionGroup name="toast" tag="div" class="toast-viewport" aria-label="Notifications">
            <div
                v-for="message in toast.messages.value"
                :key="message.id"
                :role="message.severity === 'error' ? 'alert' : 'status'"
                class="toast-message"
                :class="[`toast-${message.severity}`, { 'has-detail': !!message.detail }]"
                @mouseenter="pause(message.id)"
                @mouseleave="resume(message.id)"
                @focusin="pause(message.id)"
                @focusout="focusLeft($event, message.id)"
            >
                <span class="toast-icon" aria-hidden="true">
                    <UiIcon :name="message.severity === 'success' ? 'check' : 'info'" />
                </span>
                <div class="toast-copy">
                    <p class="toast-summary">{{ message.summary }}</p>
                    <p v-if="message.detail" class="toast-detail">{{ message.detail }}</p>
                </div>
                <button type="button" class="toast-dismiss" aria-label="Dismiss notification" @click="toast.remove(message.id)">
                    <UiIcon name="close" />
                </button>
            </div>
        </TransitionGroup>
    </Teleport>
</template>
<script setup lang="ts">
defineProps<{ target: Element | null }>();
const toast = useToast();
const timers = new Map<number, ReturnType<typeof setTimeout>>();
const paused = new Set<number>();
let mounted = false;
const clear = (id: number) => {
    clearTimeout(timers.get(id));
    timers.delete(id);
};
const pause = (id: number) => {
    paused.add(id);
    clear(id);
};
const resume = (id: number) => {
    paused.delete(id);
    clear(id);
    const message = toast.messages.value.find((item) => item.id === id);
    if (mounted && message && message.life !== 0)
        timers.set(
            id,
            setTimeout(() => toast.remove(id), Math.max(3000, message.life ?? 6000))
        );
};
const focusLeft = (event: FocusEvent, id: number) => {
    if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)) resume(id);
};
watch(
    () => toast.messages.value.map((message) => message.id),
    (ids) => {
        for (const id of timers.keys())
            if (!ids.includes(id)) {
                clear(id);
                paused.delete(id);
            }
        for (const id of ids) if (!timers.has(id) && !paused.has(id)) resume(id);
    }
);
onMounted(() => {
    mounted = true;
    for (const message of toast.messages.value) resume(message.id);
});
onBeforeUnmount(() => {
    mounted = false;
    for (const id of timers.keys()) clear(id);
    paused.clear();
});
</script>
