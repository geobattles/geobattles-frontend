<template>
    <div>
        <!-- Main Login Component content -->
        <div class="p-4 md:p-6 rounded-lg">
            <div class="flex flex-wrap">
                <!-- Login Form -->
                <div class="w-full md:w-5/12 flex flex-col items-center justify-center gap-4 py-4">
                    <h2 class="text-xl font-bold mb-2 text-center">Sign In</h2>

                    <div class="w-full mb-4">
                        <InputGroup>
                            <InputGroupAddon>
                                <i class="pi pi-user"></i>
                            </InputGroupAddon>
                            <InputText id="username" v-model="username" placeholder="Username" type="text" class="w-full" required />
                        </InputGroup>
                    </div>

                    <div class="w-full mb-4">
                        <InputGroup>
                            <InputGroupAddon>
                                <i class="pi pi-lock"></i>
                            </InputGroupAddon>
                            <Password
                                id="password"
                                v-model="password"
                                placeholder="Password"
                                :feedback="false"
                                :toggleMask="true"
                                class="w-full"
                                :inputStyle="{ width: '100%' }"
                                required
                            />
                        </InputGroup>
                    </div>

                    <div class="flex w-full">
                        <Button label="Login" :loading="isLoginLoading" icon="pi pi-sign-in" class="w-full" @click="handleLogin" />
                    </div>
                </div>

                <!-- Divider -->
                <div class="w-full md:w-2/12 flex items-center justify-center">
                    <Divider layout="vertical" class="!hidden md:!flex"><b>OR</b></Divider>
                    <Divider layout="horizontal" class="!flex md:!hidden" align="center"><b>OR</b></Divider>
                </div>

                <!-- Registration Options -->
                <div class="w-full md:w-5/12 flex flex-col gap-4 items-center justify-center py-4">
                    <h2 class="text-xl font-bold mb-2 text-center">New to GeoBattles?</h2>

                    <Button label="Sign Up" icon="pi pi-user-plus" severity="primary" class="w-full" @click="router.push('/signup')" />

                    <div class="text-center text-sm text-gray-500 my-1">or</div>

                    <Button label="Continue as Guest" severity="secondary" icon="pi pi-user" class="w-full" @click="isGuestFormVisible = true" />
                </div>
            </div>
        </div>

        <!-- Guest username Dialog -->
        <Dialog
            v-model:visible="isGuestFormVisible"
            :modal="true"
            :closable="true"
            :showHeader="true"
            header="Guest Account"
            :pt="{
                root: { class: 'border-0 rounded-xl shadow-lg' },
            }"
            class="max-w-[90vw] sm:max-w-md"
        >
            <div class="p-4 flex flex-col gap-4">
                <p class="text-sm text-gray-600 dark:text-gray-300">Enter a display name to continue as a guest. This name will be visible to other players.</p>

                <div class="mb-4">
                    <InputGroup>
                        <InputGroupAddon>
                            <i class="pi pi-id-card"></i>
                        </InputGroupAddon>
                        <InputText id="guest-username" type="text" v-model="guestDisplayName" placeholder="Display Name" class="w-full" />
                    </InputGroup>
                </div>

                <div class="flex gap-2">
                    <Button label="Cancel" icon="pi pi-times" severity="secondary" class="w-1/2" outlined @click="isGuestFormVisible = false" />
                    <Button label="Continue" icon="pi pi-check" severity="info" class="w-1/2" @click="handleRegisterGuest()" :loading="isGuestRegisterLoading" />
                </div>
            </div>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
/**
 * Login Component
 * Provides user authentication options including login, signup, and guest access
 * @author GeoBattles Team
 */

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

/**
 * Generates a random guest username with a 4-digit number
 * @returns {string} A random guest username
 */
const generateGuestUsername = () => {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `Guest${randomDigits}`;
};

// Initialize guest display name
guestDisplayName.value = generateGuestUsername();

/**
 * Handles user login authentication
 */
const handleLogin = async () => {
    if (!username.value || !password.value) {
        toast.add({
            severity: "warn",
            summary: "Missing Information",
            detail: "Please enter both username and password",
            life: 3000,
        });
        return;
    }

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
    } finally {
        isLoginLoading.value = false;
    }
};

/**
 * Handles guest user registration
 */
const handleRegisterGuest = async () => {
    if (!guestDisplayName.value) {
        toast.add({
            severity: "warn",
            summary: "Missing Information",
            detail: "Please enter a display name",
            life: 3000,
        });
        return;
    }

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
    } finally {
        isGuestRegisterLoading.value = false;
    }
};
</script>

<style scoped>
:deep(.p-password-input) {
    width: 100%;
}

:deep(.p-password) {
    display: block;
    width: 100%;
}

:deep(.p-inputgroup) {
    width: 100%;
}

:deep(.p-inputtext) {
    width: 100%;
}

:deep(.p-dialog-content) {
    border-radius: 0.75rem;
}

@media (max-width: 640px) {
    :deep(.p-password-panel) {
        min-width: 100% !important;
        left: 0 !important;
    }
}
</style>
