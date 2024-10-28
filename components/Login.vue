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
            <div class="w-full md:w-5/12 flex flex-col gap-3 items-center justify-center py-5">
                <Button label="Sign Up" icon="pi pi-user-plus" severity="success" class="w-full max-w-[17.35rem] mx-auto" @click="router.push('/signup')" />
                <span>or</span>
                <Button label="Continue as Guest" severity="secondary" icon="pi pi-user" class="w-full max-w-[17.35rem] mx-auto" @click="isGuestFormVisible = true" />
            </div>
        </div>
        <Dialog v-model:visible="isGuestFormVisible" class="w-80" pt:header:class="text-xs" header="Confirm Display Name" modal>
            <div class="flex flex-col gap-2 items-center justify-center">
                <FloatLabel>
                    <InputText id="guest-username" type="text" v-model="guestDisplayName" />
                    <label for="guest-username">Guest Username</label>
                </FloatLabel>
                <Button label="Submit" icon="pi pi-check" severity="info" class="w-full max-w-[17.35rem] mx-auto" @click="handleRegisterGuest()" />
            </div>
        </Dialog>
    </div>
</template>

<script setup>
const emit = defineEmits(["userLogged"]);
const router = useRouter();
const auth = useAuthenticationService().value;
const username = ref("");
const password = ref("");
const isGuestFormVisible = ref(false);
const guestDisplayName = ref("");
const generateGuestUsername = () => {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `Guest${randomDigits}`;
};

guestDisplayName.value = generateGuestUsername();

const handleLogin = async () => {
    try {
        await auth.login(username.value, password.value);
        // Handle successful login to close the dialog
        emit("userLogged");
    } catch (error) {
        // Handle login error
        console.error("Login failed", error);
    }
};

const handleRegisterGuest = async () => {
    try {
        await auth.register(null, null, guestDisplayName.value);
        // Handle successful login to close the dialog
        isGuestFormVisible.value = false;
        emit("userLogged");
    } catch (error) {
        // Handle login error
        console.error("Registering guest failed", error);
    }
};
</script>

<style scoped></style>
