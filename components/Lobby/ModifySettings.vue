<template>
    <div>
        <div class="settings-overlay" @click="closeSettings"></div>
        <div ref="modal_ref" class="modal">
            <div class="block">
                <h2>Lobby settings</h2>
                <div class="setting row">
                    <div class="m-auto">
                        <div>
                            <label for="lobby_name" class="block mb-2 font-medium text-gray-900 dark:text-white">Lobby name</label>
                            <input type="text" id="lobby_name" v-model="lobby_settings.conf.name" class="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-1 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Lobby name" required />
                        </div>
                    </div>
                    <div class="m-auto">
                        <div>
                            <label for="players" class="block mb-2 font-medium text-gray-900 dark:text-white">Players</label>
                            <input type="number" id="players" v-model="lobby_settings.conf.maxPlayers" class="bg-gray-50 border w-40 border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Lobby players" required />
                        </div>
                    </div>
                </div>
                <div class="setting select-mode">
                    <p>Select gamemode</p>
                    <div style="display: flex; justify-content: space-between">
                        <div><input type="radio" style="width: 24px; height: 24px" :checked="lobby_settings.conf.mode === 1" @change="radioMode(1)" /> <label for="html">BattleRoyale</label></div>
                        <div><input type="radio" style="width: 24px; height: 24px" :checked="lobby_settings.conf.mode === 2" @change="radioMode(2)" disabled /> <label for="css">CountryBattle</label></div>
                    </div>
                </div>
                <div class="setting round-timer">
                    <span>Round timer: {{ lobby_settings.conf.roundTime || 60 }} seconds</span>
                    <input ref="timer_slider" type="range" min="1" max="100" :value="lobby_settings.conf.roundTime" />
                </div>
                <div class="setting row">
                    <div class="m-auto">
                        <label for="rounds" class="block mb-2 font-medium text-gray-900 dark:text-white">Rounds</label>
                        <input type="number" min="1" max="10" id="rounds" v-model="lobby_settings.conf.numRounds" class="bg-gray-50 border w-40 border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Lobby players" required />
                    </div>
                    <div class="m-auto">
                        <label for="attempts" class="block mb-2 font-medium text-gray-900 dark:text-white">Attempts</label>
                        <input type="number" id="attempts" min="1" max="5" v-model="lobby_settings.conf.numAttempt" class="bg-gray-50 border w-40 border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Lobby players" required />
                    </div>
                </div>
                <div class="setting score-factor">
                    <span>Factor: {{ lobby_settings.conf.scoreFactor || 150 }}</span>
                    <input ref="score_factor" type="range" min="50" max="200" :value="lobby_settings.conf.scoreFactor" />
                </div>
                <div class="setting row">
                    <div style="width: 50%">
                        <div>
                            <div style="display: inline-block">Dyn. attempts</div>
                            <div class="info-icon">
                                <!-- <SvgsInfoIcon :color="'white'" :width="16" :tooltip_context="dynamic_lives_info.conf" /> -->
                            </div>
                        </div>
                        <label class="switch">
                            <input type="checkbox" :checked="lobby_settings.conf.dynLives" v-model="lobby_settings.conf.dynLives" />
                            <span class="slider round"></span>
                        </label>
                    </div>
                    <div style="width: 50%">
                        <div>
                            <div style="display: inline-block">Round bonus</div>
                            <div class="info-icon">
                                <!-- <SvgsInfoIcon :color="'white'" :width="16" :tooltip_context="round_bonus_info.conf" /> -->
                            </div>
                        </div>
                        <label class="switch">
                            <input type="checkbox" :checked="lobby_settings.conf.placeBonus" v-model="lobby_settings.conf.placeBonus" />
                            <span class="slider round"></span>
                        </label>
                    </div>
                </div>
                <div v-if="lobby_settings.conf.powerups" class="setting row">
                    <div style="width: 50%">
                        <div>
                            <div style="display: inline-block">Double score</div>
                            <div class="info-icon">
                                <!-- <SvgsInfoIcon :color="'white'" :width="16" :tooltip_context="double_round_score.conf" /> -->
                            </div>
                        </div>
                        <label class="switch">
                            <input type="checkbox" :checked="lobby_settings.conf.powerups[0]" v-model="lobby_settings.conf.powerups[0]" />
                            <span class="slider round"></span>
                        </label>
                    </div>
                    <div style="width: 50%">
                        <div>
                            <div style="display: inline-block">Duel battle</div>
                            <div class="info-icon">
                                <!-- <SvgsInfoIcon :color="'white'" :width="16" :tooltip_context="duel_info.conf" /> -->
                            </div>
                        </div>
                        <label class="switch">
                            <input type="checkbox" :checked="lobby_settings.conf.powerups[1]" v-model="lobby_settings.conf.powerups[1]" />
                            <span class="slider round"></span>
                        </label>
                    </div>
                </div>
            </div>
            <div class="text-sm md:text-xl block">
                <LobbyCountrySettings />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { useModifySettingsModal } from "~/composables/states";
import { LobbyInfo } from "~/types";

export default {
    setup() {
        const lobby_settings: Ref<LobbyInfo> = useLobbySettings();
        const this_modal = useModifySettingsModal();

        const timer_slider = ref();
        const score_factor = ref();

        onMounted(() => {
            score_factor.value.value = lobby_settings.value.conf.scoreFactor || 100;
            timer_slider.value.value = lobby_settings.value.conf.roundTime || 5;

            score_factor.value.oninput = function () {
                lobby_settings.value.conf.scoreFactor = parseInt(this.value);
            };

            timer_slider.value.oninput = function () {
                lobby_settings.value.conf.roundTime = parseInt(this.value);
            };
        });

        const radioMode = (mode: number) => {
            lobby_settings.value.conf.mode = mode;
            console.log(lobby_settings);
            // applyNewLobbySettings();
        };

        const closeSettings = () => {
            applyLobbySettings();
            this_modal.value = false;
        };
        return { this_modal, lobby_settings, timer_slider, score_factor, radioMode, closeSettings };
    },
};
</script>

<style scoped>
.settings-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(5px);
    z-index: 1;
}

.modal {
    background-color: rgb(30 41 59);
    padding: 20px;
    border-radius: 5px;
    color: white;

    /* Place element to the middle of page */
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    max-width: 750px;
    max-height: 800px;

    overflow-y: auto;
    z-index: 2;

    @apply lg:flex text-sm md:text-xl;
}

.setting {
    display: flex;
    flex-direction: column;
    margin-bottom: 30px;

    padding: 0px 40px;
}

.row {
    flex-direction: row;
    justify-content: space-between;

    text-align: center;
}

input[type="number"] {
    max-width: 60px;
    border: none;
    outline: none;
}

input[type="text"] {
    max-width: 120px;

    padding: 5px;
    border-radius: 4px;
}

input[type="range"] {
    cursor: pointer;
}

.info-icon {
    display: inline-block;
    vertical-align: text-top;
}

/* SWITCH SLIDER STYLES */
.switch {
    position: relative;
    display: block;
    margin: auto;

    width: 60px;
    height: 34px;
    font-size: 12px;
    cursor: pointer;
}
.switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    -webkit-transition: 0.4s;
    transition: 0.4s;
}

.slider:before {
    position: absolute;
    content: "";
    height: 26px;
    width: 26px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    -webkit-transition: 0.4s;
    transition: 0.4s;
}

input:checked + .slider {
    background-color: #2196f3;
}

input:focus + .slider {
    box-shadow: 0 0 1px #2196f3;
}

input:checked + .slider:before {
    -webkit-transform: translateX(26px);
    -ms-transform: translateX(26px);
    transform: translateX(26px);
}

.slider.round {
    border-radius: 34px;
}

.slider.round:before {
    border-radius: 50%;
}
/* -------------------------- */
</style>
