<template>
    <div class="component-content">
        <div>
            <div style="display: block">
                <span>Select countries:</span>
                <span>{{ (lobby_settings.conf.ccList.length | 0) + "&nbsp;/&nbsp;" + Object.keys(country_list).length }}</span>
            </div>
            <div style="display: block; margin-bottom: 20px">
                <div style="display: inline-block; vertical-align: top">
                    <label for="search" class="mb-2 text-xl font-medium text-gray-900 sr-only dark:text-white">Search</label>
                    <div style="position: relative">
                        <div class="search-icon">
                            <svg aria-hidden="true" class="icon-shape" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                        <input type="search" id="search" @keyup="filterCountryList" v-model="country_input" class="country-input" placeholder="Search country" required />
                    </div>
                </div>
                <div style="display: inline-block; vertical-align: bottom; margin-left: 10px">
                    <label>All&nbsp;</label>
                    <input type="checkbox" @click="toggleAllCountries" :checked="(lobby_settings.conf.ccList.length | 0) == Object.entries(country_list).length" />
                </div>
            </div>
        </div>
        <div class="ccode-list">
            <label v-for="(ccode, id) in filtered_list" :key="id" class="country-row">
                <input type="checkbox" :value="ccode" v-model="lobby_settings.conf.ccList" style="display: inline-block; float: left; vertical-align: top" />
                <div class="country-flag" :style="{ backgroundPosition: flag_map.get(ccode)?.x + 'px ' + flag_map.get(ccode)?.y + 'px' }" style="display: inline-block; float: left; vertical-align: top"></div>
                <div class="country-name">{{ flag_map.get(ccode)?.name }}</div>
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
.component-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}
.ccode-list {
    max-height: 600px;
    overflow-y: scroll;

    display: flex;
    flex-direction: column;
    margin: 0 auto;
}

input[type="checkbox"] {
    width: 20px;
    height: 20px;
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

.country-input {
    display: block;
    width: 100%;
    padding: 0.5rem;
    padding-left: 2.5rem;
    outline: none;
    color: #4b5563;
    background-color: #f9fafb;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
}

.search-icon {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    padding-left: 0.75rem;
    pointer-events: none;
}

.icon-shape {
    width: 1.25rem;
    margin-top: 5px;
    height: 1.25rem;

    color: #6b7280;
    fill: none;
}

.country-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
}

.country-input::placeholder {
    color: #9ca3af;
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
