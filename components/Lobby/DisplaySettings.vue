<template>
    <div>
        <div>
            <Divider pt:root:class="!mt-0" align="center">
                <b>Game Info</b>
            </Divider>
            <div class="flex justify-evenly flex-wrap">
                <div>
                    <div v-if="lobbyStore.lobbySettings?.conf.mode === 1" class="text-center flex flex-col"><Tag severity="info" class="p-mr-2">GameMode:</Tag> Battle Royale</div>
                    <div v-if="lobbyStore.lobbySettings?.conf.mode === 2" class="text-center flex flex-col"><Tag severity="info" class="p-mr-2">GameMode:</Tag> Country Battle</div>
                </div>
                <div class="flex flex-col">
                    <Tag severity="info" icon="pi pi-clock" class="p-mr-2">Round Time:</Tag>
                    <span>{{ lobbyStore.lobbySettings?.conf.roundTime }} seconds</span>
                </div>
                <div>
                    <Tag severity="info" icon="pi pi-replay" class="p-mr-2">Nr. Rounds:</Tag>
                    <div>{{ lobbyStore.lobbySettings?.conf.numRounds }}</div>
                </div>
            </div>
            <Divider align="center">
                <b>Specifics</b>
            </Divider>
            <div class="flex justify-around">
                <div class="flex flex-col">
                    <Tag severity="info"> Dynamic lives: </Tag>
                    <Tag v-if="lobbyStore.lobbySettings?.conf.dynLives" class="m-auto mt-2">ON</Tag>
                    <Tag v-else severity="secondary" class="m-auto">OFF</Tag>
                </div>
                <div class="flex flex-col">
                    <Tag severity="info"> Round bonus: </Tag>
                    <Tag v-if="lobbyStore.lobbySettings?.conf.placeBonus" class="m-auto mt-2">ON</Tag>
                    <Tag v-else severity="secondary" class="m-auto">OFF</Tag>
                </div>
            </div>
        </div>
        <!-- DISPLAY SELECTED POWERUPS -->
        <!-- <div v-if="lobbyStore.lobbySettings?.conf.powerups" style="text-align: center">
            <div>
                <h3 style="text-align: center">Powerups</h3>
                <Divider />
                <div>
                    Double score:
                    <Tag v-if="lobbyStore.lobbySettings?.conf.powerups[0]" pt:root:class="p-1">ON</Tag>
                    <Tag v-else severity="secondary">OFF</Tag>
                </div>
                <div>
                    Duel battle:
                    <Tag v-if="lobbyStore.lobbySettings?.conf.powerups[1]">ON</Tag>
                    <Tag v-else severity="secondary">OFF</Tag>
                </div>
            </div>
        </div> -->
        <!-- DISPLAY SELECTED COUNTRIES -->
        <div>
            <Divider align="center">
                <b>Selected Countries</b>
            </Divider>
            <div class="country-list-preview">
                <div v-for="(ccode, id) in lobbyStore.lobbySettings?.conf.ccList" :key="id" :title="countries_flag_map.get(ccode)?.name" style="margin: 10px">
                    <div class="tooltip bottom">
                        <div class="flag m-0 lg:m-1 scale-75 lg:scale-100" :style="{ backgroundPosition: countries_flag_map.get(ccode)?.x + 'px ' + countries_flag_map.get(ccode)?.y + 'px' }" style="display: inline-block; float: left; vertical-align: top"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const lobbyStore = useLobbyStore();
const countries_flag_map = useCountriesFlagMap();
</script>

<style scoped>
/* Countries Preview */
.country-list-preview {
    max-height: 200px;
    overflow-y: scroll;
}

.flag {
    width: 32px;
    height: 24px;
    background-image: url("/images/flags32.webp");

    border-radius: 5px;
    border: 1px solid var(--p-primary-600);
}

.country-list-preview::-webkit-scrollbar {
    width: 4px;
}
.country-list-preview::-webkit-scrollbar-track {
    background-color: #15202b;
}
.country-list-preview::-webkit-scrollbar-thumb {
    background-color: rgb(109, 109, 109);
    border-radius: 10px;
}
</style>
