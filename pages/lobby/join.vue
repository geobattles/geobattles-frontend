<template>
    <div class="h-screen relative">
        <Toast position="bottom-right" />
        <Header class="absolute w-full" />
        <div class="flex flex-col justify-center items-center h-full">
            <div class="flex flex-wrap justify-center scale-75 lg:scale-100" ref="input_parent">
                <input ref="input_1" class="sign-input" @keyup="handleKeyUpEvent($event)" @keydown="handleKeyDownEvent($event)" type="text" />
                <input ref="input_2" class="sign-input" @keyup="handleKeyUpEvent($event)" @keydown="handleKeyDownEvent($event)" type="text" />
                <input ref="input_3" class="sign-input" @keyup="handleKeyUpEvent($event)" @keydown="handleKeyDownEvent($event)" type="text" />
                <input ref="input_4" class="sign-input" @keyup="handleKeyUpEvent($event)" @keydown="handleKeyDownEvent($event)" type="text" />
            </div>
            <div class="flex items-center gap-5">
                <div>Insert or paste lobby code to join the game!</div>
                <Button @click="handleJoinLobbyClick" icon="pi pi-play" label="Join" size="small" outlined />
            </div>
        </div>
        <div v-if="isLoading" class="overlay">
            <div class="flex flex-col gap-5">
                <div class="text-white text-2xl lg:text-4xl font-bold">Joining lobby...</div>
                <ProgressSpinner style="width: 75px; height: 75px" strokeWidth="8" fill="transparent" animationDuration=".5s" aria-label="Custom ProgressSpinner" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const lobbyURLParameter = ref("");
const isLoading = ref(false);

// Input refs and variables
const input_parent = ref<HTMLInputElement | null>(null);
const input_1 = ref<HTMLInputElement | null>(null);
const input_2 = ref<HTMLInputElement | null>(null);
const input_3 = ref<HTMLInputElement | null>(null);
const input_4 = ref<HTMLInputElement | null>(null);
let inputs_array: Ref<HTMLInputElement | null>[] = [];

// External services
const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();
const { checkIfLobby, joinLobby } = useLobbyStore();

onMounted(() => {
    input_1.value?.focus(); // Focus first input
    inputs_array = [input_1, input_2, input_3, input_4]; // Create array of inputs for logic

    handePasteEvent(); // Activate paste event

    // Check if there is lobby_id in url
    const lobbyIdParam = router.currentRoute.value.query.id;
    lobbyURLParameter.value = Array.isArray(lobbyIdParam) ? lobbyIdParam[0] || "" : lobbyIdParam || "";
    console.info(lobbyURLParameter.value);

    if (lobbyURLParameter.value) {
        const lobby_id = lobbyURLParameter.value.split("").slice(0, 6).join("");
        inputs_array.forEach((input, id) => {
            if (input.value) input.value.value = lobby_id[id];
        });

        if (!authStore.isAuthenticated) return (authStore.isLoginDialog = true);
        handleJoinLobby(lobbyURLParameter.value);
    }
});

const handleJoinLobby = async (lobby_id: string) => {
    isLoading.value = true;
    try {
        await checkIfLobby(lobby_id);
        await joinLobby(lobby_id);
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(error.message);
            inputs_array.forEach((input) => input.value?.classList.add("error-lobby")); // Add error class to inputs
            toast.add({
                severity: "error",
                summary: "Error Joining Lobby",
                detail: error.message,
                life: 2000,
            });
        }
    } finally {
        isLoading.value = false;
    }
};

const handleJoinLobbyClick = async () => {
    const lobby_id = inputs_array.map((input) => input.value?.value).join("");
    await handleJoinLobby(lobby_id);
};

const handePasteEvent = async () => {
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
            await handleJoinLobby(clipboard_string);
        }
    });
};

const handleKeyUpEvent = async (event: KeyboardEvent) => {
    const input_element = event.target as HTMLInputElement;
    input_element.value = input_element.value.toUpperCase();

    if (input_1.value?.value && input_2.value?.value && input_3.value?.value && input_4.value?.value) {
        // Get all inputs text and combine it to one string
        const lobby_id = input_1.value.value + input_2.value.value + input_3.value.value + input_4.value.value;

        // Try joining a lobby
        await handleJoinLobby(lobby_id);
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
        inputs_array.forEach((input) => input.value?.classList.remove("error-lobby")); // Remove error class from inputs
    }
};
</script>

<style scoped>
.sign-input {
    background: transparent;
    border: 0.15rem solid var(--p-primary-400);
    border-radius: 0.75rem;
    font-size: 3rem;
    font-weight: 700;
    height: 9.375rem;
    margin: 1rem;
    text-align: center;
    transition: all 0.2s ease-out;
    width: 6rem;

    color: var(--p-primary-400);
    outline: none;

    text-transform: uppercase;
}

.error-lobby {
    border-color: var(--p-red-500);
}

.error-lobby:focus {
    border-color: var(--p-red-500) !important;
}

.sign-input:focus {
    border-color: var(--p-primary-400);
}

.overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.75);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}
</style>
