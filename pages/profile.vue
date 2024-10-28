<template>
    <div>
        <Header />
        <Panel header="Profile" class="w-full md:w-1/2 mx-auto mt-10">
            Identified as
            <Tag v-if="playerInfo.guest" value="Guest" severity="secondary"></Tag>
            <Tag v-else value="Player" severity="info"></Tag>
        </Panel>
    </div>
</template>

<script setup lang="ts">
const playerInfo = usePlayerInfo();
</script>

<style scoped></style>
