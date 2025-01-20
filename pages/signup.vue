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
            <Button label="Sign Up" @click="onSubmit()" :loading="isRegisterLoading" type="submit" size="small" severity="primary" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

// Form fields
const username = ref("");
const displayName = ref("");
const password = ref("");
const isRegisterLoading = ref(false);

// External services
const playerInfo = usePlayerInfo();
const { register } = useAuthStore();
const router = useRouter();
const toast = useToast();
const isLoginDialogVisible = useIsLoginDialogVisible();

const onSubmit = async () => {
    isRegisterLoading.value = true;

    // Call the API to sign up
    try {
        // Validate the form fields
        if (!username.value || !displayName.value || !password.value) {
            const missingFields = [];
            if (!username.value) missingFields.push("Username");
            if (!displayName.value) missingFields.push("Display Name");
            if (!password.value) missingFields.push("Password");

            toast.add({ severity: "warn", summary: "Missing Fields", detail: `Please fill in the following fields: ${missingFields.join(", ")}`, life: 5000 });
            isRegisterLoading.value = false;
            return;
        }

        await register(username.value, password.value, displayName.value);
        console.log("Registration successful");

        // Update the player info
        playerInfo.value.username = username.value;
        playerInfo.value.displayName = displayName.value;

        isLoginDialogVisible.value = false; // Close the login dialog if it's open

        router.push("/"); // Redirect to the home page after successful registration
    } catch (error) {
        // Handle register error
        const errorMessage = (error instanceof Error && error.message) || "Unknown error";
        toast.add({ severity: "error", summary: "Error registering", detail: errorMessage, life: 5000 });
        isRegisterLoading.value = false;
    }
};
</script>

<style scoped>
.error-message {
    color: red;
    margin-top: 10px;
}
</style>
