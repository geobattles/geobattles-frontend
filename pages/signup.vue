<template>
    <div class="signup-container">
        <Toast />
        <div class="mb-5 p-5 text-center font-bold" style="color: var(--p-primary-400)">Sign Up Form</div>
        <div class="flex flex-col gap-6 items-center">
            <FloatLabel>
                <InputText id="username" v-model="username" type="text" required />
                <label for="username">Username</label>
            </FloatLabel>
            <FloatLabel>
                <InputText id="displayName" v-model="displayName" type="text" required />
                <label for="username">Display Name</label>
            </FloatLabel>
            <FloatLabel>
                <Password id="password" v-model="password" required />
                <label for="username">Password</label>
            </FloatLabel>
            <Button label="Sign Up" @click="onSubmit()" type="submit" size="small" severity="primary" />
            <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const username = ref("");
const displayName = ref("");
const password = ref("");
const errorMessage = ref("");
const playerInfo = usePlayerInfo();
const router = useRouter();
const auth = useAuthenticationService().value;
const toast = useToast();

const onSubmit = async () => {
    console.log("Username:", username.value);
    console.log("Email:", displayName.value);
    console.log("Password:", password.value);

    // Clear previous error message
    errorMessage.value = "";

    // Call the API to sign up
    try {
        await auth.register(username.value, password.value, displayName.value);
        console.log("Registration successful");

        // Update the player info
        playerInfo.value.username = username.value;
        playerInfo.value.displayName = displayName.value;

        router.push("/"); // Redirect to the home page after successful registration
    } catch (error) {
        // Handle register error
        const errorMessage = (error instanceof Error && error.message) || "Unknown error";
        toast.add({ severity: "error", summary: "Error registering", detail: errorMessage, life: 5000 });
    }
};
</script>

<style scoped>
.error-message {
    color: red;
    margin-top: 10px;
}
</style>
