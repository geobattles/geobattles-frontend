<template>
    <div>
        <Panel header="Lobby Settings" :class="{ 'player-view': !isPlayerAdmin() }">
            <div class="settings-preview">
                <div>
                    <h3 class="text-center">Game info</h3>
                    <hr style="margin-bottom: 15px" />
                    <div v-if="lobby_settings.conf.mode === 1" class="text-center">Mode: Battle Royale</div>
                    <div v-if="lobby_settings.conf.mode === 2" class="text-center">Mode: Country Battle</div>
                    <div class="flex flex-row justify-center gap-3">
                        <i class="pi pi-stopwatch" style="font-size: 1rem; margin: auto 0"></i>
                        {{ lobby_settings.conf.roundTime }}''
                    </div>
                    <div>
                        <div>Number of rounds: {{ lobby_settings.conf.numRounds }}</div>
                    </div>
                    <div>
                        Dynamic lives:
                        <span v-if="lobby_settings.conf.dynLives" style="color: #57c657">ON</span>
                        <span v-else style="color: #a1a1a1">OFF</span>
                    </div>
                    <div>
                        Round bonus:
                        <span v-if="lobby_settings.conf.placeBonus" style="color: #57c657">ON</span>
                        <span v-else style="color: #a1a1a1">OFF</span>
                    </div>
                </div>
                <!-- DISPLAY SELECTED POWERUPS -->
                <div v-if="lobby_settings.conf.powerups" style="text-align: center">
                    <div>
                        <h3 style="text-align: center">Powerups</h3>
                        <hr style="margin-bottom: 15px" />
                        <div>
                            Double score:
                            <span v-if="lobby_settings.conf.powerups[0]" style="color: #57c657">ON</span>
                            <span v-else style="color: #a1a1a1">OFF</span>
                        </div>
                        <div>
                            Duel battle:
                            <span v-if="lobby_settings.conf.powerups[1]" style="color: #57c657">ON</span>
                            <span v-else style="color: #a1a1a1">OFF</span>
                        </div>
                    </div>
                </div>
                <!-- DISPLAY SELECTED COUNTRIES -->
                <div>
                    <h3 style="text-align: center">Selected countries</h3>
                    <hr style="margin-bottom: 15px" />
                    <div class="country-list-preview">
                        <div v-for="(ccode, id) in lobby_settings.conf.ccList" :key="id" :title="countries_flag_map.get(ccode)?.name" style="margin: 10px">
                            <div class="tooltip bottom">
                                <div class="flag" :style="{ backgroundPosition: countries_flag_map.get(ccode)?.x + 'px ' + countries_flag_map.get(ccode)?.y + 'px' }" style="display: inline-block; float: left; vertical-align: top"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div style="text-align: center">
                <Button @click="modify_settings_modal = !modify_settings_modal" type="button" label="Modify Settings" icon="pi pi-cog" badgeSeverity="contrast" outlined />
            </div>
        </Panel>
        <LobbyModifySettings v-if="modify_settings_modal" />
    </div>
</template>

<script lang="ts">
export default {
    setup() {
        const lobby_settings = useLobbySettings();
        const countries_flag_map = useCountriesFlagMap();
        const modify_settings_modal = useModifySettingsModal();

        return { lobby_settings, countries_flag_map, modify_settings_modal, isPlayerAdmin };
    },
};
</script>

<style scoped>
.player-view {
    opacity: 0.7;
    pointer-events: none;
}

.settings-preview {
    font-size: 15px;
}

/* Countries Preview */
.country-list-preview {
    max-height: 200px;
    overflow-y: scroll;

    max-width: 420px;
    overflow: auto;

    margin: 15px auto;
}

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
