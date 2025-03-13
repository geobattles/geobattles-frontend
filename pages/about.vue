<template>
    <div>
        <Header />
        <div class="main-content text-sm md:text-base">
            <Panel header="About us" pt:header:class="text-xl">
                <p>This is an open-source geolocation guessing game called GeoBattles.</p>
            </Panel>
            <Version class="text-sm lg:text-base" />
        </div>
    </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.main-content {
    max-width: 800px;
    margin: auto;
    margin-top: 20px;

    display: flex;
    flex-direction: column;
    justify-content: space-between;
}
</style>
