<template>
    <div class="component-content">
        <div v-if="lobbyStore.lobbySettings" style="overflow: scroll">
            <!-- Search field and Select all button -->
            <div class="flex justify-center items-center gap-5 mb-5 mt-5">
                <FloatLabel>
                    <InputText id="search" v-model="countryInput" @keyup="filterCountryList" size="small" />
                    <label for="username">Search country</label>
                </FloatLabel>
                <div class="text-xs flex flex-col justify-between items-center">
                    <div>
                        <label>All&nbsp;</label>
                        <input type="checkbox" @click="toggleAllCountries" :checked="(lobbyStore.lobbySettings.conf.ccList.length ?? 0) == Object.entries(countryList).length" />
                    </div>
                    <div>
                        <span>Selected: </span>
                        <span>{{ (lobbyStore.lobbySettings.conf.ccList.length ?? 0) + "&nbsp;/&nbsp;" + Object.keys(countryList).length }}</span>
                    </div>
                </div>
            </div>

            <!-- Country list -->
            <div class="ccode-list">
                <div v-for="(ccode, id) in filtered_list" :key="id" class="country-row text-xs lg:text-sm w-[180px] h-[40px] lg:w-[250px] lg:h-[40px]">
                    <Checkbox :value="ccode" v-model="lobbyStore.lobbySettings.conf.ccList" />
                    <div class="country-flag" :style="{ backgroundPosition: getFlagBackgroundPosition(ccode) }"></div>
                    <div class="text-left">{{ flagMap.get(ccode)?.name }}</div>
                </div>
            </div>
        </div>
        <div v-else>
            <p>lobbyStore.LobbySettings is not Defined...</p>
        </div>
    </div>
</template>

<script setup lang="ts">
// External services
const filtered_list = useFilteredCountryList();
const lobbyStore = useLobbyStore();
const countryList = useCountryList();
const flagMap = useCountriesFlagMap();
const countryInput = useCountryInput();
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
    flex-wrap: wrap;
    gap: 5px;
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
    margin: 0 10px;
    background-image: url("/images/flags32.webp");
}

.country-row {
    cursor: pointer;

    border-radius: 20px;
    padding: 10px 8px;
    background-color: var(--surface-background);

    display: flex;
    align-items: center;

    margin: auto;
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
