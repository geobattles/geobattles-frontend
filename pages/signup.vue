<template>
    <div>
        <Header />
        <div class="signup-container">
            <div class="mb-5 text-center font-bold" style="color: var(--p-primary-400)">Sign Up Form</div>
            <div class="flex flex-col gap-6 items-center">
                <FloatLabel>
                    <InputText id="username" v-model="username" type="text" required />
                    <label for="username">Username</label>
                </FloatLabel>
                <FloatLabel>
                    <InputText id="email" v-model="email" type="email" required />
                    <label for="username">Email address</label>
                </FloatLabel>
                <FloatLabel>
                    <Password id="password" v-model="password" required />
                    <label for="username">Password</label>
                </FloatLabel>
                <Button label="Sign Up" @click="onSubmit()" type="submit" size="small" severity="primary" />
                <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const username = ref("");
const email = ref("");
const password = ref("");
const errorMessage = ref("");

const onSubmit = async () => {
    console.log("Username:", username.value);
    console.log("Email:", email.value);
    console.log("Password:", password.value);

    // Clear previous error message
    errorMessage.value = "";

    // Call the API to sign up
    try {
        const response = await registerPlayer(username.value, email.value, password.value);
        console.log("Registration successful:", response);
    } catch (error) {
        console.error("Registration failed:", error);
        errorMessage.value = "Registration failed. Please try again." + error;
    }
};
</script>

<style scoped>
.signup-container {
    margin-top: 1%;
}

.error-message {
    color: red;
    margin-top: 10px;
}
</style>
