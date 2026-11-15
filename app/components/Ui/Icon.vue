<template>
    <svg
        class="ui-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        focusable="false"
    >
        <template v-if="name === 'compass'">
            <circle cx="12" cy="12" r="9" />
            <path d="m16 8-2.5 5.5L8 16l2.5-5.5L16 8Z" />
        </template>
        <template v-else-if="name === 'globe'">
            <circle cx="12" cy="12" r="9" />
            <ellipse cx="12" cy="12" rx="4" ry="9" />
            <path d="M3 12h18M5 6.5h14M5 17.5h14" />
        </template>
        <template v-else-if="name === 'arrow'"><path d="M4 12h16m-6-6 6 6-6 6" /></template>
        <template v-else-if="name === 'check'"><path d="m5 12 4 4L19 6" /></template>
        <template v-else-if="name === 'close'"><path d="m6 6 12 12M6 18 18 6" /></template>
        <template v-else-if="name === 'copy'">
            <rect x="8" y="8" width="12" height="13" rx="2" />
            <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
        </template>
        <template v-else-if="name === 'user'">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
        </template>
        <template v-else-if="name === 'users'">
            <circle cx="9" cy="8" r="3" />
            <path d="M2 20v-2a7 7 0 0 1 14 0v2M16 5a3 3 0 0 1 0 6m3 9v-2a7 7 0 0 0-2-5" />
        </template>
        <template v-else-if="name === 'settings'">
            <path d="M4 7h16M4 17h16" />
            <circle cx="9" cy="7" r="3" fill="var(--gb-surface)" />
            <circle cx="15" cy="17" r="3" fill="var(--gb-surface)" />
        </template>
        <template v-else-if="name === 'pin'">
            <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z" />
            <circle cx="12" cy="10" r="2.5" />
        </template>
        <template v-else-if="name === 'map'"><path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16" /></template>
        <template v-else-if="name === 'journal'"><path d="M5 3h14v18H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm0 0v18m4-13h6m-6 4h6m-6 4h3" /></template>
        <template v-else-if="name === 'refresh'"><path d="M20 10a8 8 0 0 0-14-5L3 8m0-5v5h5m-4 6a8 8 0 0 0 14 5l3-3m0 5v-5h-5" /></template>
        <template v-else-if="name === 'fullscreen'"><path d="M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6" /></template>
        <template v-else-if="name === 'leave'"><path d="M10 4H4v16h6m3-12 4 4-4 4m-5-4h13" /></template>
        <template v-else-if="name === 'clock'">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 6v6l4 2" />
        </template>
        <template v-else-if="name === 'crown'"><path d="m3 6 5 4 4-7 4 7 5-4-2 14H5L3 6Z" /></template>
        <template v-else-if="name === 'trophy'"><path d="M8 3h8v6a4 4 0 0 1-8 0V3Zm0 2H3v2a5 5 0 0 0 5 5m8-7h5v2a5 5 0 0 1-5 5m-4 1v8m-5 0h10" /></template>
        <template v-else-if="name === 'wifi'">
            <path d="M2 8a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0m-11 4a6 6 0 0 1 8 0" />
            <circle cx="12" cy="20" r="1" />
        </template>
        <template v-else-if="name === 'eye'">
            <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
        </template>
        <template v-else-if="name === 'plus'"><path d="M12 4v16M4 12h16" /></template>
        <template v-else-if="name === 'menu'"><path d="M4 6h16M4 12h16M4 18h16" /></template>
        <template v-else-if="name === 'info'">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v6m0-10v.1" />
        </template>
        <template v-else-if="name === 'heart'"><path d="M20 5a5 5 0 0 0-8 1 5 5 0 0 0-8-1c-4 5 2 10 8 15 6-5 12-10 8-15Z" /></template>
        <template v-else-if="name === 'external'"><path d="M14 3h7v7m0-7L10 14M10 4H4v16h16v-6" /></template>
        <template v-else>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v6m0 4v.1" />
        </template>
    </svg>
</template>
<script setup lang="ts">
defineProps<{ name: string }>();
</script>
<style scoped>
.ui-icon {
    width: 1.2em;
    height: 1.2em;
    flex: none;
    vertical-align: middle;
}
</style>
