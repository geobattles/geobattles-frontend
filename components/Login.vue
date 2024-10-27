<template>
    <div>
        <div class="flex flex-col md:flex-row">
            <div class="w-full md:w-5/12 flex flex-col items-center justify-center gap-3 py-5">
                <div class="flex flex-col gap-2">
                    <label for="username">Username</label>
                    <InputText id="username" type="text" v-model="username" />
                </div>
                <div class="flex flex-col gap-2">
                    <label for="password">Password</label>
                    <InputText id="password" type="password" v-model="password" />
                </div>
                <div class="flex">
                    <Button label="Login" icon="pi pi-user" class="w-full max-w-[17.35rem] mx-auto" @click="handleLogin" />
                </div>
            </div>
            <div class="w-full md:w-2/12">
                <Divider layout="vertical" class="!hidden md:!flex"><b>OR</b></Divider>
                <Divider layout="horizontal" class="!flex md:!hidden" align="center"><b>OR</b></Divider>
            </div>
            <div class="w-full md:w-5/12 flex items-center justify-center py-5">
                <Button label="Sign Up" icon="pi pi-user-plus" severity="success" class="w-full max-w-[17.35rem] mx-auto" @click="router.push('/signup')" />
            </div>
        </div>
    </div>
</template>

<script setup>
const emit = defineEmits(["userLogged"]);
const router = useRouter();
const username = ref("");
const password = ref("");

const handleLogin = async () => {
    try {
        await loginPlayer(username.value, password.value);
        // Handle successful login to close the dialog
        emit("userLogged");
    } catch (error) {
        // Handle login error
        console.error("Login failed", error);
    }
};
</script>

<style scoped></style>
