<template>
    <div>
        <Header />
        <div class="signup-container">
            <div class="mb-5 text-center font-bold" style="color: var(--p-primary-400)">Sign Up</div>
            <form @submit.prevent="onSubmit" class="flex flex-col gap-6 items-center">
                <FloatLabel>
                    <InputText id="username" v-model="username" type="text" required />
                    <label for="username">Username</label>
                </FloatLabel>
                <FloatLabel>
                    <InputText id="email" v-model="email" type="email" required />
                    <label for="username">Email</label>
                </FloatLabel>
                <FloatLabel>
                    <Password id="password" v-model="password" required />
                    <label for="username">Password</label>
                </FloatLabel>
                <Button label="Sign Up" type="submit" size="small" severity="primary" />
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
const username = ref("");
const email = ref("");
const password = ref("");

const onSubmit = () => {
    console.log("Username:", username.value);
    console.log("Email:", email.value);
    console.log("Password:", password.value);
};
</script>

<style scoped>
.signup-container {
    max-width: 400px;
    height: 500px;
    margin: 0 auto;
    padding: 2rem;
}
</style>
