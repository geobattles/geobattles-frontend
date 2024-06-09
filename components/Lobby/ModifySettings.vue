<template>
    <div>
        <div class="settings-overlay" @click="closeSettings"></div>
        <div ref="modal_ref" class="settings-modal text-xs md:text-sm" header="Lobby Settings">
            <Panel class="settings-block" header="Lobby Settings" si>
                <div class="flex flex-row gap-2">
                    <Panel class="flex flex-column m-auto" style="display: flex; flex-direction: column; scale: 0.8" header="Lobby Name">
                        <InputText id="lobby_name" v-model="lobby_settings.conf.name" aria-describedby="username-help" />
                    </Panel>
                    <Panel header="Nr. Players" style="scale: 0.7">
                        <InputNumber v-model="lobby_settings.conf.maxPlayers" showButtons buttonLayout="vertical" style="width: 3rem" :min="0" :max="99">
                            <template #incrementbuttonicon>
                                <span class="pi pi-plus" />
                            </template>
                            <template #decrementbuttonicon>
                                <span class="pi pi-minus" />
                            </template>
                        </InputNumber>
                    </Panel>
                </div>
                <Panel class="setting select-mode" header="Select gamemode" style="scale: 0.8">
                    <div style="display: flex; justify-content: space-between">
                        <div><input type="radio" style="width: 24px; height: 24px" :checked="lobby_settings.conf.mode === 1" @change="radioMode(1)" /> <label for="html">BattleRoyale</label></div>
                        <div><input type="radio" style="width: 24px; height: 24px" :checked="lobby_settings.conf.mode === 2" @change="radioMode(2)" /> <label for="css">CountryBattle</label></div>
                        <!-- <div class="flex align-items-center">
                            <RadioButton v-model="lobby_settings.conf.mode" @change="radioMode(1)" inputId="gm_1" name="Battle" :value="lobby_settings.conf.mode" />
                            <label for="gm_1" class="ml-2">Battle Royale</label>
                        </div>
                        <div class="flex align-items-center">
                            <RadioButton v-model="lobby_settings.conf.mode" @change="radioMode(2)" inputId="gm_2" name="Countries" :value="lobby_settings.conf.mode" />
                            <label for="gm_2" class="ml-2">Country Battle</label>
                        </div> -->
                    </div>
                </Panel>
                <div class="setting round-timer">
                    <span>Round timer: {{ lobby_settings.conf.roundTime || 60 }} seconds</span>
                    <Slider ref="timer_slider" v-model="lobby_settings.conf.roundTime" :min="1" :max="100" class="w-14rem mt-3" />
                </div>
                <div class="flex flex-row justify-around gap-2" style="scale: 0.8">
                    <Panel header="Rounds">
                        <InputNumber v-model="lobby_settings.conf.numRounds" showButtons buttonLayout="vertical" style="width: 3rem" :min="0" :max="99">
                            <template #incrementbuttonicon>
                                <span class="pi pi-plus" />
                            </template>
                            <template #decrementbuttonicon>
                                <span class="pi pi-minus" />
                            </template>
                        </InputNumber>
                    </Panel>
                    <Panel header="Attempts">
                        <InputNumber v-model="lobby_settings.conf.numAttempt" showButtons buttonLayout="vertical" style="width: 3rem" :min="0" :max="99">
                            <template #incrementbuttonicon>
                                <span class="pi pi-plus" />
                            </template>
                            <template #decrementbuttonicon>
                                <span class="pi pi-minus" />
                            </template>
                        </InputNumber>
                    </Panel>
                </div>
                <div class="setting score-factor mt-4">
                    <span>Score factor: {{ lobby_settings.conf.scoreFactor || 150 }}</span>
                    <Slider ref="score_factor" v-model="lobby_settings.conf.scoreFactor" :min="50" :max="200" class="w-14rem mt-3" />
                </div>
                <div style="display: flex; flex-direction: row; gap: 10px; scale: 0.9">
                    <div style="width: 50%">
                        <Panel header="Dynamic lives">
                            <InputSwitch v-model="lobby_settings.conf.dynLives" :checked="lobby_settings.conf.dynLives" />
                        </Panel>
                    </div>
                    <div style="width: 50%">
                        <Panel header="Place bonus">
                            <InputSwitch v-model="lobby_settings.conf.placeBonus" :checked="lobby_settings.conf.placeBonus" />
                        </Panel>
                    </div>
                </div>
                <div v-if="lobby_settings.conf.powerups" style="display: flex; flex-direction: row; gap: 10px; margin-top: 20px; scale: 0.9">
                    <div style="width: 50%">
                        <Panel header="Double score">
                            <InputSwitch v-model="lobby_settings.conf.powerups[0]" :checked="lobby_settings.conf.powerups[0]" />
                        </Panel>
                    </div>
                    <div style="width: 50%">
                        <Panel header="Duel battle">
                            <InputSwitch v-model="lobby_settings.conf.powerups[1]" :checked="lobby_settings.conf.powerups[1]" />
                        </Panel>
                    </div>
                </div>
            </Panel>
            <Panel class="countries-block" header="Country Settings">
                <LobbyCountrySettings />
            </Panel>
        </div>
    </div>
</template>

<script lang="ts">
import type { LobbyInfo } from "~/types";

export default {
    setup() {
        const lobby_settings: Ref<LobbyInfo> = useLobbySettings();
        const this_modal = useModifySettingsModal();

        const timer_slider = ref();
        const score_factor = ref();

        onMounted(() => {
            score_factor.value.oninput = function () {
                lobby_settings.value.conf.scoreFactor = parseInt(this.value);
            };

            timer_slider.value.oninput = function () {
                lobby_settings.value.conf.roundTime = parseInt(this.value);
            };
        });

        const radioMode = (mode: number) => {
            lobby_settings.value.conf.mode = mode;
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

.settings-modal {
    padding: 20px;
    border-radius: 5px;

    /* Place element to the middle of page */
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    max-height: 80%;

    overflow-y: auto;
    z-index: 2;
    background-color: var(--surface-card);

    width: 90%;
    max-width: 1000px;

    display: flex;
    flex-direction: row;
    gap: 5%;
    flex-wrap: wrap;
}

.settings-block {
    flex: 1 1 45%;
    width: 100%;
}

.countries-block {
    flex: 1 1 45%;
    width: 100%;
}

.setting {
    display: flex;
    flex-direction: column;
    text-align: center;
    margin-bottom: 30px;

    padding: 0px 40px;
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

/* Custom slider */
.settings-modal::-webkit-scrollbar {
    width: 4px;
}
.settings-modal::-webkit-scrollbar-track {
    background-color: #15202b;
}
.settings-modal::-webkit-scrollbar-thumb {
    background-color: rgb(109, 109, 109);
    border-radius: 10px;
}
</style>
