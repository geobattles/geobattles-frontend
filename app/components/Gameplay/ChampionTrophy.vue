<template>
    <svg class="champion-trophy" viewBox="0 0 300 300" fill="none" aria-hidden="true" focusable="false">
        <defs>
            <linearGradient :id="`${id}-gold`" x1="65" y1="0" x2="236" y2="30" gradientUnits="userSpaceOnUse">
                <stop stop-color="#744515" />
                <stop offset=".16" stop-color="#e3a94f" />
                <stop offset=".31" stop-color="#fff1b6" />
                <stop offset=".48" stop-color="#f5c96a" />
                <stop offset=".65" stop-color="#ad6623" />
                <stop offset=".79" stop-color="#edb54d" />
                <stop offset=".91" stop-color="#ffe6a1" />
                <stop offset="1" stop-color="#8d501b" />
            </linearGradient>
            <linearGradient :id="`${id}-shade`" x1="150" y1="58" x2="150" y2="188" gradientUnits="userSpaceOnUse">
                <stop stop-color="#82481b" stop-opacity=".15" />
                <stop offset=".46" stop-color="#ffa73b" stop-opacity=".04" />
                <stop offset="1" stop-color="#4a2815" stop-opacity=".87" />
            </linearGradient>
            <linearGradient :id="`${id}-base`" x1="69" y1="240" x2="232" y2="278" gradientUnits="userSpaceOnUse">
                <stop stop-color="#322c23" />
                <stop offset=".44" stop-color="#142821" />
                <stop offset="1" stop-color="#0b211a" />
            </linearGradient>
            <linearGradient :id="`${id}-lip`" x1="85" y1="36" x2="225" y2="52" gradientUnits="userSpaceOnUse">
                <stop stop-color="#f7ba56" />
                <stop offset=".47" stop-color="#fff5c9" />
                <stop offset="1" stop-color="#d89030" />
            </linearGradient>
        </defs>

        <g :stroke="`url(#${id}-gold)`" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
            <path d="M82 64C70 56 30 50 28 79c-2 31 34 61 70 70M218 64c12-8 52-14 54 15 2 31-34 61-70 70" />
            <path d="M93 117c-17 0-24 9-18 21 4 8 15 13 28 14m104-35c17 0 24 9 18 21-4 8-15 13-28 14" stroke-width="5" />
        </g>
        <path d="M78 61c-29-8-46-2-45 17 1 20 19 38 40 47m149-64c29-8 46-2 45 17-1 20-19 38-40 47" stroke="#fff0ba" stroke-opacity=".67" stroke-width="2" />

        <path d="M130 167h40l-4 32c-1 16 11 25 30 29v10h-92v-10c19-4 31-13 30-29z" :fill="`url(#${id}-gold)`" stroke="#b78343" stroke-width="2" />
        <path d="M124 182h52v11h-52zM114 222h72v10h-72z" :fill="`url(#${id}-lip)`" stroke="#a86c2e" stroke-width="1.6" />

        <path d="M67 54h166l-9 55c-6 39-32 70-74 76-42-6-68-37-74-76z" :fill="`url(#${id}-gold)`" stroke="#ffc972" stroke-width="2.3" />
        <path d="M67 54h166l-9 55c-6 39-32 70-74 76-42-6-68-37-74-76z" :fill="`url(#${id}-shade)`" />
        <path d="M80 64c5 54 19 91 52 105M93 69c2 27 8 50 17 66m110-71c-5 54-19 91-52 105" stroke="#fff0b6" stroke-opacity=".64" stroke-width="2" stroke-linecap="round" />
        <path d="M63 48c3-9 43-14 87-14s84 5 87 14l-3 12c-54 9-114 9-168 0z" :fill="`url(#${id}-lip)`" stroke="#a67134" stroke-width="2" />
        <ellipse cx="150" cy="47" rx="86" ry="10" fill="#92511f" stroke="#fff2be" stroke-width="3" />
        <path d="M76 48c21-6 113-7 147 0-39 7-112 7-147 0Z" fill="#4e321b" />
        <path d="M69 60c45 9 115 9 162 0" stroke="#fff6c1" stroke-opacity=".8" stroke-width="2" />

        <circle cx="150" cy="118" r="27" fill="#5b451d" fill-opacity=".73" stroke="#ffeab0" stroke-width="2" />
        <circle cx="150" cy="118" r="21" stroke="#edbd62" stroke-opacity=".62" />
        <path d="M150 96l6 16 16 6-16 6-6 16-6-16-16-6 16-6z" fill="#fff1b2" stroke="#ab772e" />
        <circle cx="150" cy="118" r="4" fill="#856327" />
        <path
            d="M119 121c-8-4-10-10-9-16 6 3 9 9 9 16Zm2 10c-8-2-12-7-12-13 7 2 11 7 12 13Zm6 8c-8 0-13-4-15-10 8 0 12 4 15 10Zm54-18c8-4 10-10 9-16-6 3-9 9-9 16Zm-2 10c8-2 12-7 12-13-7 2-11 7-12 13Zm-6 8c8 0 13-4 15-10-8 0-12 4-15 10Z"
            fill="#efd393"
        />

        <path d="M96 232h108l12 12v18H84v-18z" :fill="`url(#${id}-base)`" stroke="#b78a49" stroke-width="2" />
        <path d="M91 230h118l9 13H82z" :fill="`url(#${id}-gold)`" stroke="#f8d27d" stroke-width="1.7" />
        <path d="M82 262h136l10 10v9H72v-9z" :fill="`url(#${id}-base)`" stroke="#b58945" stroke-width="2" />
        <path d="M77 268h146l5 5H72z" :fill="`url(#${id}-lip)`" />
        <rect x="125" y="247" width="50" height="10" rx="3" :fill="`url(#${id}-lip)`" stroke="#926136" />
        <path d="M134 252h32" stroke="#80552d" stroke-width="1.5" stroke-linecap="round" />
    </svg>
</template>

<script setup lang="ts">
const id = useId();
</script>
