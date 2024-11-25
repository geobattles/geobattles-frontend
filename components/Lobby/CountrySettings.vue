<template>
    <div class="component-content">
        <div v-if="lobbySettings" style="overflow: scroll">
            <div class="flex justify-center items-center gap-2 mb-5 mt-1">
                <div style="display: inline-block; vertical-align: top">
                    <label for="search" class="mb-2 text-xl font-medium text-gray-900 sr-only dark:text-white">Search</label>
                    <div style="position: relative">
                        <FloatLabel>
                            <InputText id="search" v-model="country_input" @keyup="filterCountryList" />
                            <label for="username">Search country</label>
                        </FloatLabel>
                    </div>
                </div>
                <div class="text-xs flex flex-col justify-between items-center">
                    <div>
                        <label>All&nbsp;</label>
                        <input type="checkbox" @click="toggleAllCountries" :checked="(lobbySettings.conf.ccList.length ?? 0) == Object.entries(country_list).length" />
                    </div>
                    <div>
                        <span>Selected: </span>
                        <span>{{ (lobbySettings.conf.ccList.length ?? 0) + "&nbsp;/&nbsp;" + Object.keys(country_list).length }}</span>
                    </div>
                </div>
            </div>
            <div class="ccode-list">
                <label v-for="(ccode, id) in filtered_list" :key="id" class="country-row">
                    <Checkbox :value="ccode" v-model="lobbySettings.conf.ccList" style="float: left; vertical-align: top" />
                    <div class="country-flag" :style="{ backgroundPosition: flag_map.get(ccode)?.x + 'px ' + flag_map.get(ccode)?.y + 'px' }" style="display: inline-block; float: left; vertical-align: top"></div>
                    <div class="country-name">{{ flag_map.get(ccode)?.name }}</div>
                </label>
            </div>
        </div>
        <div v-else>
            <p>LobbySettings is not Defined...</p>
        </div>
    </div>
</template>

<script setup lang="ts">
const filtered_list = useFilteredCountryList();
const lobbyStore = useLobbyStore();
const { lobbySettings } = toRefs(lobbyStore);
const country_list = useCountryList();
const flag_map = useCountriesFlagMap();
const country_input = useCountryInput();
</script>

<style scoped>
.component-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    text-align: center;
}

.ccode-list {
    display: flex;
    flex-direction: column;
}

input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;

    border: none;
    outline: none;
}

.country-flag {
    width: 32px;
    height: 24px;
    margin-left: 10px;
    margin-right: 10px;
    background-image: url("/images/flags32.webp");
}

.country-row {
    cursor: pointer;
    margin-bottom: 10px;

    width: 250px;
    max-block-size: 100px;
}

.country-name {
    float: inline-end;
    padding-right: 10px;
}

/* CHANGE SCROLLBAR */
.ccode-list::-webkit-scrollbar {
    width: 4px;
}
.ccode-list::-webkit-scrollbar-track {
    background-color: #15202b;
}
.ccode-list::-webkit-scrollbar-thumb {
    background-color: rgb(109, 109, 109);
    border-radius: 10px;
}
</style>
