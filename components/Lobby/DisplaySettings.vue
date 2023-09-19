<template>
    <div>
        <div ref="settings_form" class="component-content text-xl md:text-2xl m-auto" :class="{ notAdmin: false }">
            <h2>Lobby Settings</h2>
            <div class="settings-preview">
                <div>
                    <h3 style="text-align: center">Round info</h3>
                    <hr style="margin-bottom: 15px" />
                    <div style="text-align: center">
                        <span>Mode: Battle Royale</span>
                    </div>
                    <div class="flex flex-row justify-center gap-3">
                        <SvgsTimerIcon :color="'white'" :width="16" />
                        {{ lobby_settings.conf.roundTime }}''
                    </div>
                    <div style="display: inline-block; width: 50%">
                        <li>Number of rounds: {{ lobby_settings.conf.numRounds }}</li>
                        <li>Attempts per round: {{ lobby_settings.conf.numAttempt }}</li>
                    </div>
                    <div style="display: inline-block; vertical-align: top">
                        <li>
                            Dynamic lives:
                            <span v-if="lobby_settings.conf.dynLives" style="color: #57c657">ON</span>
                            <span v-else style="color: #a1a1a1">OFF</span>
                            &nbsp;
                            <span style="display: inline-block; vertical-align: text-top">
                                <!-- <SvgsInfoIcon :color="'#9aa2df'" :width="16" :tooltip_context="lobby_settings.conf.dynamic_lives_info" /> -->
                            </span>
                        </li>
                        <li>
                            Round bonus:
                            <span v-if="lobby_settings.conf.placeBonus" style="color: #57c657">ON</span>
                            <span v-else style="color: #a1a1a1">OFF</span>
                            &nbsp;
                            <!-- <span style="display: inline-block; vertical-align: text-top">
                                <SvgsInfoIcon :color="'#9aa2df'" :width="16" :tooltip_context="lobby_settings.conf.round_bonus_info" />
                            </span> -->
                        </li>
                    </div>
                </div>
                <!--! POWERUPS ARE DISABLED FOR NOW -->
                <!-- <div v-if="setting_store.lobby_settings.powerups">
                    <div>
                        <h3 style="text-align: center">Powerups</h3>
                        <hr style="margin-bottom: 15px" />
                        <div style="display: inline-block; width: 50%">
                            <li>
                                Double score:
                                <span v-if="setting_store.lobby_settings.powerups[0]" style="color: #57c657">ON</span>
                                <span v-else style="color: #a1a1a1">OFF</span>
                                &nbsp;
                                <span style="display: inline-block; vertical-align: text-top">
                                    <SvgsInfoIcon :color="'#9aa2df'" :width="16" :tooltip_context="setting_store.double_round_score" />
                                </span>
                            </li>
                        </div>
                        <div style="display: inline-block; width: 50%">
                            <li>
                                Duel battle:
                                <span v-if="setting_store.lobby_settings.powerups[1]" style="color: #57c657">ON</span>
                                <span v-else style="color: #a1a1a1">OFF</span>
                                &nbsp;
                                <span style="display: inline-block; vertical-align: text-top">
                                    <SvgsInfoIcon :color="'#9aa2df'" :width="16" :tooltip_context="setting_store.duel_info" />
                                </span>
                            </li>
                        </div>
                    </div>
                </div> -->
                <div>
                    <h3 style="text-align: center">Selected countries</h3>
                    <hr style="margin-bottom: 15px" />
                    <div class="country-list-preview">
                        <div v-for="(ccode, id) in lobby_settings.conf.ccList" :key="id" :title="countries_flag_map.get(ccode)?.name">
                            <div class="tooltip bottom">
                                <div class="flag" :style="{ backgroundPosition: countries_flag_map.get(ccode)?.x + 'px ' + countries_flag_map.get(ccode)?.y + 'px' }" style="display: inline-block; float: left; vertical-align: top"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="mt-5">
                <button @click="modify_settings_modal = !modify_settings_modal" class="text-white text-xl m-auto bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Modify Settings</button>
            </div>
        </div>
        <LobbyModifySettings v-if="modify_settings_modal" />
    </div>
</template>

<script lang="ts">
export default {
    setup() {
        const lobby_settings = useLobbySettings();
        const countries_flag_map = useCountriesFlagMap();
        const modify_settings_modal = useModifySettingsModal();

        return { lobby_settings, countries_flag_map, modify_settings_modal };
    },
};
</script>

<style scoped>
.component-content {
    background-color: #15202b;
    color: white;

    padding: 10px 30px;
    border-radius: 10px;

    max-width: 480px;
}

h2 {
    margin-bottom: 20px;
}

.settings-preview {
    text-align: left;
    color: #cccccc;
}
.notAdmin {
    opacity: 0.7;
}
.notAdmin input {
    pointer-events: none;
}
.notAdmin button {
    display: none;
}

.country-list-preview {
    max-height: 200px;
    overflow-y: scroll;

    max-width: 420px;
    overflow: auto;
}

/* Countries Preview */
.flag {
    width: 32px;
    height: 24px;
    margin-left: 4px;
    margin-right: 4px;
    margin-bottom: 6px;
    background-image: url("/images/flags32.webp");

    margin-bottom: 8px;
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
