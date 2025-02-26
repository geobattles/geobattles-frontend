<template>
    <div>
        <Toast />
        <!-- Main Login Component content -->
        <div class="flex flex-wrap">
            <div class="w-full md:w-5/12 flex flex-col items-center justify-center gap-3 py-5">
                <FloatLabel class="mb-4">
                    <InputText id="username" v-model="username" type="text" required />
                    <label for="username">Username</label>
                </FloatLabel>
                <FloatLabel>
                    <Password id="password" v-model="password" required />
                    <label for="username">Password</label>
                </FloatLabel>
                <div class="flex">
                    <Button label="Login" :loading="isLoginLoading" icon="pi pi-user" class="w-full max-w-[17.35rem] mx-auto" @click="handleLogin" />
                </div>
            </div>
            <div class="w-full md:w-2/12">
                <Divider layout="vertical" class="!hidden md:!flex"><b>OR</b></Divider>
                <Divider layout="horizontal" class="!flex md:!hidden" align="center"><b>OR</b></Divider>
            </div>
            <div class="w-full md:w-5/12 flex flex-col gap-3 items-center justify-center py-5">
                <Button label="Sign Up" icon="pi pi-user-plus" severity="primary" class="w-full max-w-[17.35rem] mx-auto" @click="router.push('/signup')" />
                <span>or</span>
                <Button label="Continue as Guest" severity="secondary" icon="pi pi-user" class="w-full max-w-[17.35rem] mx-auto" @click="isGuestFormVisible = true" />
            </div>
        </div>

        <!-- Guest username Dialog -->
        <Dialog v-model:visible="isGuestFormVisible" class="w-80" pt:header:class="text-xs" header="Confirm Display Name" modal>
            <div class="flex flex-col gap-2 items-center justify-center">
                <FloatLabel>
                    <InputText id="guest-username" type="text" v-model="guestDisplayName" />
                    <label for="guest-username">Guest Username</label>
                </FloatLabel>
                <Button
                    label="Submit"
                    icon="pi pi-check"
                    severity="info"
                    class="w-full max-w-[17.35rem] mx-auto"
                    @click="handleRegisterGuest()"
                    :loading="isGuestRegisterLoading"
                />
            </div>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
// External states
const toast = useToast();
const router = useRouter();
const { login, register } = useAuthStore();

// Component state
const username = ref("");
const password = ref("");
const isGuestFormVisible = ref(false);
const guestDisplayName = ref("");
const isLoginLoading = ref(false);
const isGuestRegisterLoading = ref(false);
const emit = defineEmits(["userLogged"]);

const generateGuestUsername = () => {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `Guest${randomDigits}`;
};

guestDisplayName.value = generateGuestUsername();

const handleLogin = async () => {
    isLoginLoading.value = true;
    try {
        await login(username.value, password.value);
        // Handle successful login to close the dialog
        emit("userLogged");
    } catch (error) {
        // Handle login error
        const errorMessage = (error instanceof Error && error.message) || "Unknown error";
        toast.add({
            severity: "error",
            summary: "Error logging in",
            detail: errorMessage,
            life: 5000,
        });
        isLoginLoading.value = false;
    }
};

const handleRegisterGuest = async () => {
    isGuestRegisterLoading.value = true;
    try {
        await register(null, null, guestDisplayName.value);
        // Handle successful login to close the dialog
        isGuestFormVisible.value = false;
        emit("userLogged");
    } catch (error) {
        // Handle login error
        console.error("Registering guest failed", error);
        toast.add({
            severity: "error",
            summary: "Error registering guest",
            detail: "Failed to register guest. Please try again later.",
            life: 5000,
        });
        isGuestRegisterLoading.value = false;
    }
};
</script>

<style scoped></style>
