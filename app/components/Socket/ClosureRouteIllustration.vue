<template>
    <svg class="route-art" viewBox="0 0 560 214" fill="none" aria-hidden="true" focusable="false">
        <defs>
            <radialGradient :id="haloId">
                <stop stop-color="#f47055" stop-opacity=".28" />
                <stop offset="1" stop-color="#ff624d" stop-opacity="0" />
            </radialGradient>
            <linearGradient :id="edgeId" x1="0" y1="0" x2="0" y2="1">
                <stop stop-color="#ffe1c0" />
                <stop offset="1" stop-color="#ff7966" />
            </linearGradient>
            <linearGradient :id="ticketId" x1="0" y1="0" x2="1" y2="1">
                <stop stop-color="#71372d" stop-opacity=".92" />
                <stop offset="1" stop-color="#38211f" stop-opacity=".96" />
            </linearGradient>
        </defs>
        <g class="contours">
            <path d="M1 80c83 13 123-49 190-48 87 0 98 37 178 23s109-22 190-6M1 94c78 16 125-45 190-47 81-2 101 40 179 24 76-16 122-29 189-9" />
            <path d="M1 109c75 20 126-40 190-44 71-4 105 38 179 25 69-12 124-32 189-13M1 124c73 17 133-39 191-41 73-2 111 39 178 27 89-16 125-36 189-18" />
            <path d="M1 173c86 23 138-20 205-23 70-3 88 36 166 26 87-11 122-40 187-25M1 188c80 20 145-22 203-21 77 1 97 36 172 27 91-11 121-39 183-25" />
            <ellipse cx="280" cy="128" rx="150" ry="59" />
            <ellipse cx="280" cy="128" rx="138" ry="53" />
        </g>
        <path class="route-original" pathLength="1" d="M34 150c79 34 89-61 168-39 60 17 90 69 158 50 60-17 98-61 166-49" />
        <g class="route-split">
            <path class="route-dashes" d="M34 150c66 31 90-51 160-41m170 51c59-15 98-60 162-48" />
            <path class="route-break" d="M202 111c23 6 38 18 51 26m46 24c18 5 38 6 57 1" />
        </g>
        <g class="route-pins">
            <path d="M34 113a12 12 0 0 0-12 12c0 8 12 20 12 20s12-12 12-20a12 12 0 0 0-12-12Zm0 6a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Z" />
            <path d="M526 76a12 12 0 0 0-12 12c0 8 12 20 12 20s12-12 12-20a12 12 0 0 0-12-12Zm0 6a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Z" />
        </g>
        <ellipse class="ticket-halo" :fill="'url(#' + haloId + ')'" cx="280" cy="111" rx="147" ry="92" />
        <g transform="translate(280 112) rotate(-16)">
            <g class="ticket">
                <path
                    class="ticket-edge"
                    pathLength="1"
                    :fill="'url(#' + ticketId + ')'"
                    :stroke="'url(#' + edgeId + ')'"
                    d="M-62-40H62q8 0 8 8v16a16 16 0 0 0 0 32v16q0 8-8 8H-62q-8 0-8-8V16a16 16 0 0 0 0-32v-16q0-8 8-8Z"
                />
                <path class="ticket-cross" d="m-13-13 26 26m0-26-26 26" />
            </g>
        </g>
        <path class="ticket-rays" d="M251 40l-8-12m37 6V16m27 25 9-13" />
    </svg>
</template>

<script setup lang="ts">
const id = useId();
const haloId = id + "-halo";
const edgeId = id + "-edge";
const ticketId = id + "-ticket";
</script>

<style scoped>
.route-art {
    display: block;
    block-size: auto;
    overflow: visible;
}
.contours {
    stroke: #a0e7a3;
    stroke-width: 0.8;
    opacity: 0.23;
}
.route-original,
.route-dashes,
.route-break {
    stroke-linecap: round;
    stroke-width: 2.6;
}
.route-original,
.route-dashes {
    stroke: var(--closure-lime);
}
.route-original {
    opacity: 0;
    stroke-dasharray: 1;
}
.route-dashes,
.route-break {
    stroke-dasharray: 6 7;
}
.route-break {
    stroke: #ff826d;
    opacity: 0.75;
    filter: drop-shadow(0 0 3px #ff826d9c);
}
.route-pins {
    fill: var(--closure-lime);
    fill-rule: evenodd;
    filter: drop-shadow(0 0 9px #a5fa8272);
}
.ticket-halo {
    transform-origin: 50% 52%;
}
.ticket {
    filter: drop-shadow(0 0 5px #ff594e) drop-shadow(0 0 14px #f4534e8c);
}
.ticket-edge {
    stroke-width: 4.5;
}
.ticket-cross,
.ticket-rays {
    stroke: #ffb296;
    stroke-linecap: round;
    stroke-width: 4;
}
.ticket-cross {
    stroke-width: 6;
}
.ticket-rays {
    filter: drop-shadow(0 0 5px #ff6b51);
}
@media (prefers-reduced-motion: no-preference) {
    .contours {
        animation: closure-contours var(--closure-duration) ease-out both;
    }
    .route-original {
        animation: closure-route-draw var(--closure-duration) ease-out both;
    }
    .route-split,
    .route-pins {
        animation: closure-route-split var(--closure-duration) ease-out both;
    }
    .route-pins {
        animation-name: closure-pins;
    }
    .ticket {
        animation: closure-ticket var(--closure-duration) ease-out both;
    }
    .ticket-edge {
        stroke-dasharray: 1;
        animation: closure-outline var(--closure-duration) ease-out both;
    }
    .ticket-cross,
    .ticket-rays {
        animation: closure-cross var(--closure-duration) ease-out both;
    }
    .ticket-halo {
        animation: closure-halo var(--closure-duration) ease-out both;
    }
    @keyframes closure-contours {
        0% {
            opacity: 0;
        }
        21%,
        100% {
            opacity: 0.23;
        }
    }
    @keyframes closure-route-draw {
        0% {
            opacity: 1;
            stroke-dashoffset: 1;
        }
        21% {
            opacity: 0.88;
            stroke-dashoffset: 0;
        }
        46%,
        100% {
            opacity: 0;
            stroke-dashoffset: 0;
        }
    }
    @keyframes closure-route-split {
        0%,
        21% {
            opacity: 0;
        }
        46%,
        100% {
            opacity: 1;
        }
    }
    @keyframes closure-pins {
        0% {
            opacity: 0;
        }
        21%,
        100% {
            opacity: 1;
        }
    }
    @keyframes closure-ticket {
        0%,
        44% {
            opacity: 0;
            transform: scale(0.82);
        }
        65% {
            opacity: 1;
            transform: scale(1.04);
        }
        78%,
        100% {
            opacity: 1;
            transform: scale(1);
        }
    }
    @keyframes closure-outline {
        0%,
        44% {
            stroke-dashoffset: 1;
            fill-opacity: 0;
        }
        64%,
        100% {
            stroke-dashoffset: 0;
            fill-opacity: 1;
        }
    }
    @keyframes closure-cross {
        0%,
        55% {
            opacity: 0;
        }
        70%,
        100% {
            opacity: 1;
        }
    }
    @keyframes closure-halo {
        0%,
        44% {
            opacity: 0;
            transform: scale(0.8);
        }
        70% {
            opacity: 1;
            transform: scale(1.14);
        }
        100% {
            opacity: 1;
            transform: scale(1);
        }
    }
}
</style>
