<template>
    <svg class="home-route" viewBox="0 0 360 82" fill="none" aria-hidden="true" focusable="false">
        <defs>
            <linearGradient :id="ridge" x2="0" y2="1">
                <stop stop-color="#a8f081" />
                <stop offset="1" stop-color="#174a2c" />
            </linearGradient>
        </defs>
        <g class="route-contours">
            <path d="M2 23c60 13 93-24 153-10 64 15 89 49 203 14M2 34c62 11 91-24 153-10 64 17 89 47 203 15M2 76c56 11 96-30 153-16 64 15 89 39 203 5" />
        </g>
        <path class="route-line" d="M26 63c47 3 69-32 124-26 70 8 109 48 184 13" />
        <path :fill="'url(#' + ridge + ')'" d="m132 57 25-24 14 13 19-27 36 38Z" />
        <path class="route-ridge" d="m135 56 22-21 12 11m-4 5 25-31 34 36" />
        <path fill="#efffc3" d="m183 28 7-8 8 9-5-2-2 7-4-6Z" />
        <g class="route-pin" fill-rule="evenodd">
            <path d="M26 30a12.5 12.5 0 0 0-12.5 12.5c0 7 12.5 19 12.5 19s12.5-12 12.5-19A12.5 12.5 0 0 0 26 30Zm0 6.3a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Z" />
            <path d="M334 17a12.5 12.5 0 0 0-12.5 12.5c0 7 12.5 19 12.5 19s12.5-12 12.5-19A12.5 12.5 0 0 0 334 17Zm0 6.3a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Z" />
        </g>
    </svg>
</template>

<script setup lang="ts">
const ridge = useId() + "-ridge";
</script>

<style scoped>
.home-route {
    overflow: visible;
}
.route-contours {
    stroke: #90e5a053;
    stroke-width: 0.85;
}
.route-line,
.route-ridge {
    stroke: #dbff9d;
    stroke-linecap: round;
    stroke-linejoin: round;
}
.route-line {
    stroke-width: 2.6;
    stroke-dasharray: 6.5 6;
}
.route-ridge {
    stroke-width: 2.1;
}
.route-pin {
    fill: #e0ff9e;
    filter: drop-shadow(0 0 7px #c9fa8c70);
}
</style>
