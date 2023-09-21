<template>
    <div class="setting country-selector text-xl md:text-2xl">
        <div>
            <div style="display: block">
                <span>Select countries:</span>
                <span>{{ (lobby_settings.conf.ccList.length | 0) + "&nbsp;/&nbsp;" + Object.keys(country_list).length }}</span>
            </div>
            <div style="display: block; margin-bottom: 20px">
                <!-- <div>
                    <input type="text" @keyup="country_store.filterCountryList" v-model="country_store.country_input" placeholder="Search country" />
                </div> -->
                <form style="display: inline-block; vertical-align: top">
                    <label for="search" class="mb-2 text-xl font-medium text-gray-900 sr-only dark:text-white">Search</label>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <svg aria-hidden="true" class="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                        <input type="search" id="search" @keyup="filterCountryList" v-model="country_input" class="block w-full p-2 pl-10 outline-none text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Search country" required />
                    </div>
                </form>
                <div id="toggleAll" style="display: inline-block; vertical-align: top; margin-left: 10px">
                    <label>All&nbsp;</label>
                    <input type="checkbox" @click="toggleAllCountries" :checked="(lobby_settings.conf.ccList.length | 0) == Object.entries(country_list).length" />
                </div>
            </div>
        </div>
        <div class="setting ccode-list">
            <label v-for="(ccode, id) in filtered_list" :key="id" class="country-row">
                <input class="country-col" type="checkbox" :value="ccode" v-model="lobby_settings.conf.ccList" style="display: inline-block; float: left; vertical-align: top" />
                <div class="flag" :style="{ backgroundPosition: flag_map.get(ccode)?.x + 'px ' + flag_map.get(ccode)?.y + 'px' }" style="display: inline-block; float: left; vertical-align: top"></div>
                <div class="country-col" style="display: inline-block; float: right; white-space: nowrap; vertical-align: top">{{ flag_map.get(ccode)?.name }}</div>
            </label>
        </div>
    </div>
</template>

<script lang="ts">
export default {
    setup() {
        const filtered_list = useFilteredCountryList();
        const lobby_settings = useLobbySettings();
        const country_list = useCountryList();
        const flag_map = useCountriesFlagMap();
        const country_input = useCountryInput();

        return { lobby_settings, country_list, filtered_list, flag_map, country_input, filterCountryList, toggleAllCountries };
    },
};
</script>

<style scoped>
.setting {
    display: flex;
    flex-direction: column;
    margin-bottom: 30px;

    padding: 0px 10px;
}

.ccode-list {
    max-height: 500px;
    overflow-y: scroll;
}
input[type="checkbox"] {
    width: 20px;
    height: 20px;
    cursor: pointer;

    border: none;
    outline: none;
}

.flag {
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

/*  Edit scrollbar */
.notAdmin .country-row {
    pointer-events: none;
}

.notAdmin #toggleAll {
    display: none !important;
}
</style>
