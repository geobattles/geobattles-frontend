<template>
    <div>
        <Header />
        <Panel class="main-content text-sm md:text-base" header="About us" pt:header:class="text-xl">
            <p>This is an open-source geolocation guessing game called GeoBattles...</p>
        </Panel>
    </div>
</template>

<script>
export default {
    name: "AboutPage",
};
</script>

<style scoped>
.main-content {
    max-width: 800px;
    margin: auto;
    margin-top: 3%;
}
</style>
