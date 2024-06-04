<template>
    <div class="page-container">
        <div class="inputs-parent" ref="input_parent">
            <input ref="input_1" class="sign-input" @keyup="handleKeyUpEvent($event)" @keydown="handleKeyDownEvent($event)" type="text" />
            <input ref="input_2" class="sign-input" @keyup="handleKeyUpEvent($event)" @keydown="handleKeyDownEvent($event)" type="text" />
            <input ref="input_3" class="sign-input" @keyup="handleKeyUpEvent($event)" @keydown="handleKeyDownEvent($event)" type="text" />
            <input ref="input_4" class="sign-input" @keyup="handleKeyUpEvent($event)" @keydown="handleKeyDownEvent($event)" type="text" />
            <input ref="input_5" class="sign-input" @keyup="handleKeyUpEvent($event)" @keydown="handleKeyDownEvent($event)" type="text" />
            <input ref="input_6" class="sign-input" @keyup="handleKeyUpEvent($event)" @keydown="handleKeyDownEvent($event)" type="text" />
        </div>
        <div>
            <span style="color: white">Join the game!</span>
        </div>
    </div>
</template>

<script lang="ts">
export default {
    setup() {
        const lobby_name = ref("");
        const input_parent = ref<HTMLInputElement | null>(null);
        const input_1 = ref<HTMLInputElement | null>(null);
        const input_2 = ref<HTMLInputElement | null>(null);
        const input_3 = ref<HTMLInputElement | null>(null);
        const input_4 = ref<HTMLInputElement | null>(null);
        const input_5 = ref<HTMLInputElement | null>(null);
        const input_6 = ref<HTMLInputElement | null>(null);
        let inputs_array: Ref<HTMLInputElement | null>[] = [];

        onMounted(() => {
            input_1.value?.focus(); // Focus first input
            inputs_array = [input_1, input_2, input_3, input_4, input_5, input_6]; // Create array of inputs for logic\

            handePasteEvent(); // Activate paste event
        });

        const handePasteEvent = () => {
            // Create paste event listener
            input_parent.value?.addEventListener("paste", async (event) => {
                event.preventDefault(); // Prevent default paste
                const clipboard_data = event.clipboardData; // Get clipboard data

                if (clipboard_data) {
                    const clipboard_string = clipboard_data.getData("text");

                    // Split data and assign one char to each input
                    const splitted_data = clipboard_string.split("");
                    inputs_array.forEach((input, id) => {
                        if (input.value) input.value.value = splitted_data[id];
                    });

                    // Try joining a lobby
                    if (useSocketConnection().value.OPEN) return;
                    try {
                        await checkIfLobby(clipboard_string);
                        await joinLobby(clipboard_string);
                    } catch (error: unknown) {
                        if (error instanceof Error) {
                            console.log(error.message);
                            inputs_array.forEach((input) => input.value?.classList.add("error-lobby")); // Add error class to inputs
                        }
                    }
                }
            });
        };

        const handleKeyUpEvent = async (event: KeyboardEvent) => {
            const input_element = event.target as HTMLInputElement;
            input_element.value = input_element.value.toUpperCase();

            if (input_1.value?.value && input_2.value?.value && input_3.value?.value && input_4.value?.value && input_5.value?.value && input_6.value?.value) {
                // Get all inputs text and combine it to one string
                const lobby_id = input_1.value.value + input_2.value.value + input_3.value.value + input_4.value.value + input_5.value.value + input_6.value.value;

                // Try joining a lobby
                if (useSocketConnection().value.OPEN) return;
                try {
                    await checkIfLobby(lobby_id);
                    await joinLobby(lobby_id);
                } catch (error: unknown) {
                    if (error instanceof Error) {
                        console.log(error.message);
                        inputs_array.forEach((input) => input.value?.classList.add("error-lobby")); // Add error class to inputs
                    }
                }
            }

            // Focus next input after input is filled
            if (input_element.value.length > 0) {
                const nextInput = input_element.nextElementSibling as HTMLInputElement;
                if (nextInput) nextInput.focus();
            }
        };

        const handleKeyDownEvent = (event: KeyboardEvent) => {
            const input_element = event.target as HTMLInputElement;

            // Disables multiple letters in input
            if (input_element.value.length === 1 && event.key !== "Backspace") event.preventDefault();

            // Handles backspace
            if (event.key === "Backspace") {
                const previous_input = input_element.previousElementSibling as HTMLInputElement;
                if (previous_input && input_element.value.length === 0) {
                    previous_input.focus();
                    previous_input.value = "";
                }
                // Remove error class from inputs
                inputs_array.forEach((input) => input.value?.classList.remove("error-lobby"));
            }
        };
        return { createLobby, joinLobby, lobby_name, input_parent, input_1, input_2, input_3, input_4, input_5, input_6, useLobbySettings, handleKeyUpEvent, handleKeyDownEvent };
    },
};
</script>

<style scoped>
.page-container {
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.sign-input {
    background: transparent;
    border: 0.0625rem solid #fff;
    border-radius: 0.75rem;
    font-size: 3rem;
    font-weight: 700;
    height: 9.375rem;
    margin: 1rem;
    padding: 0px 30px;
    text-align: center;
    transition: all 0.2s ease-out;
    width: 7rem;

    color: white;
    outline: none;

    text-transform: uppercase;
}

.error-lobby {
    border-color: red;
}

.error-lobby:focus {
    border-color: red !important;
}

.sign-input:focus {
    border-color: #fecd19;
}
</style>
