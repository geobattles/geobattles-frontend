<template>
    <svg class="icon" :width="props.width" :height="props.height" :style="{ fill: props.color }" viewBox="0 0 512 512">
        <path d="M256 512C114.6 512 0 397.4 0 256S114.6 0 256 0S512 114.6 512 256s-114.6 256-256 256zM232 120V256c0 8 4 15.5 10.7 20l96 64c11 7.4 25.9 4.4 33.3-6.7s4.4-25.9-6.7-33.3L280 243.2V120c0-13.3-10.7-24-24-24s-24 10.7-24 24z" />
    </svg>
</template>

<script>
export default {
    props: ["color", "width", "height"],

    setup(props) {
        if (process.server) return;
        return { props };
    },
};
</script>

<style scoped></style>
