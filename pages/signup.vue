<template>
    <div>
        <Header />
        <div class="max-w-lg mx-auto px-4 py-4 md:py-8">
            <Card class="shadow-lg">
                <template #header>
                    <div class="bg-gradient-to-r from-blue-600 to-indigo-800 p-4 md:p-6 rounded-t-lg flex items-center space-x-4">
                        <div class="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white flex items-center justify-center shadow-lg flex-shrink-0">
                            <i class="pi pi-user-plus text-2xl md:text-3xl text-blue-800"></i>
                        </div>
                        <div>
                            <h1 class="text-xl md:text-2xl font-bold text-white mb-0">Create Account</h1>
                            <p class="text-blue-100 text-xs md:text-sm">Join GeoBattles and start playing!</p>
                        </div>
                    </div>
                </template>
                <template #content>
                    <div class="p-4 md:p-6">
                        <form @submit.prevent="onSubmit">
                            <div class="mb-6">
                                <InputGroup>
                                    <InputGroupAddon>
                                        <i class="pi pi-user"></i>
                                    </InputGroupAddon>
                                    <FloatLabel>
                                        <InputText id="username" v-model="username" class="w-full" :class="{ 'p-invalid': errors.username }" @blur="validateUsername" />
                                        <label for="username">Username</label>
                                    </FloatLabel>
                                </InputGroup>
                                <small v-if="errors.username" class="p-error block mt-1">{{ errors.username }}</small>
                                <small class="text-gray-500 block mt-1 text-xs md:text-sm" v-else>Choose a unique username for login</small>
                            </div>

                            <div class="mb-6">
                                <InputGroup>
                                    <InputGroupAddon>
                                        <i class="pi pi-id-card"></i>
                                    </InputGroupAddon>
                                    <FloatLabel>
                                        <InputText id="displayName" v-model="displayName" class="w-full" :class="{ 'p-invalid': errors.displayName }" @blur="validateDisplayName" />
                                        <label for="displayName">Display Name</label>
                                    </FloatLabel>
                                </InputGroup>
                                <small v-if="errors.displayName" class="p-error block mt-1">{{ errors.displayName }}</small>
                                <small class="text-gray-500 block mt-1 text-xs md:text-sm" v-else>This name will be visible to other players</small>
                            </div>

                            <div class="mb-6">
                                <InputGroup>
                                    <InputGroupAddon>
                                        <i class="pi pi-lock"></i>
                                    </InputGroupAddon>
                                    <FloatLabel>
                                        <Password
                                            id="password"
                                            v-model="password"
                                            class="w-full"
                                            :feedback="true"
                                            :toggleMask="true"
                                            :class="{ 'p-invalid': errors.password }"
                                            @blur="validatePassword"
                                            :inputStyle="{ width: '100%' }"
                                        />
                                        <label for="password">Password</label>
                                    </FloatLabel>
                                </InputGroup>
                                <small v-if="errors.password" class="p-error block mt-1">{{ errors.password }}</small>
                            </div>

                            <div class="mt-20">
                                <Button
                                    type="submit"
                                    label="Create Account"
                                    icon="pi pi-user-plus"
                                    :loading="isRegisterLoading"
                                    :disabled="!isFormValid || isRegisterLoading"
                                    class="w-full"
                                />
                            </div>

                            <div class="mt-4 text-center">
                                <p class="text-sm text-gray-600 dark:text-gray-400">
                                    Already have an account?
                                    <a @click="navigateToLogin" class="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">Sign in</a>
                                </p>
                            </div>
                        </form>
                    </div>
                </template>
            </Card>
        </div>

        <Toast position="bottom-center" />
    </div>
</template>

<script setup lang="ts">
// Form fields
const username = ref("");
const displayName = ref("");
const password = ref("");
const isRegisterLoading = ref(false);

// Form validation errors
const errors = reactive({
    username: null as string | null,
    displayName: null as string | null,
    password: null as string | null,
});

// External services
const authStore = useAuthStore();
const router = useRouter();
const toast = useToast();

onMounted(() => {
    authStore.isLoginDialog = false; // Ensure the login dialog is closed on mount
});

/**
 * Validates the username field
 */
function validateUsername() {
    errors.username = null;

    if (!username.value) {
        errors.username = "Username is required";
        return;
    }

    if (username.value.length < 3) {
        errors.username = "Username must be at least 3 characters";
    }
}

/**
 * Validates the display name field
 */
function validateDisplayName() {
    errors.displayName = null;

    if (!displayName.value) {
        errors.displayName = "Display name is required";
        return;
    }

    if (displayName.value.length < 3) {
        errors.displayName = "Display name must be at least 3 characters";
    }
}

/**
 * Validates the password field
 */
function validatePassword() {
    errors.password = null;

    if (!password.value) {
        errors.password = "Password is required";
    }
}

/**
 * Computed property to check if form is valid for submission
 */
const isFormValid = computed(() => {
    return username.value && displayName.value && password.value && !errors.username && !errors.displayName && !errors.password;
});

/**
 * Navigates to the login page or opens login dialog
 */
function navigateToLogin() {
    authStore.isLoginDialog = true;
}

/**
 * Handles form submission for user registration
 */
async function onSubmit() {
    // Run all validations
    validateUsername();
    validateDisplayName();
    validatePassword();

    if (!isFormValid.value) {
        return;
    }

    isRegisterLoading.value = true;

    try {
        await authStore.register(username.value, password.value, displayName.value);
        console.info("Registration successful");

        authStore.isLoginDialog = false; // Close the login dialog if it's open

        router.push("/"); // Redirect to the home page after successful registration
    } catch (error: any) {
        // Handle register error
        const errorMessage = error?.message || "Unknown error";
        toast.add({
            severity: "error",
            summary: "Registration Failed",
            detail: errorMessage,
            life: 5000,
        });
    } finally {
        isRegisterLoading.value = false;
    }
}
</script>

<style scoped>
/* Custom styles for signup page */
:deep(.p-password-input) {
    width: 100%;
}

:deep(.p-password) {
    display: block;
    width: 100%;
}

:deep(.p-password-panel) {
    width: 100%;
    max-width: 100%;
}

:deep(.p-inputgroup) {
    width: 100%;
}

:deep(.p-float-label) {
    width: 100%;
}

:deep(.p-inputtext) {
    width: 100%;
}

@media (max-width: 640px) {
    :deep(.p-password-panel) {
        min-width: 100% !important;
        left: 0 !important;
    }
}

:deep(.p-card-header) {
    padding: 0;
}
</style>
