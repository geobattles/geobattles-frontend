<template>
    <div>
        <Header />
        <div class="max-w-5xl mx-auto px-4 py-4 md:py-8">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <!-- User Information Card -->
                <Card class="col-span-1 shadow-lg">
                    <template #header>
                        <div class="bg-gradient-to-r from-blue-600 to-indigo-800 p-4 md:p-6 rounded-t-lg flex flex-col items-center justify-center">
                            <div class="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white flex items-center justify-center shadow-lg mb-3 md:mb-4">
                                <i class="pi pi-user text-4xl md:text-5xl text-blue-800"></i>
                            </div>
                            <h2 class="text-xl font-bold text-white">{{ playerInfo.displayName || "Player" }}</h2>
                            <div class="mt-2">
                                <Tag v-if="playerInfo.guest" value="Guest Account" severity="warning" class="mr-2"></Tag>
                                <Tag v-else value="Registered Player" severity="info"></Tag>
                            </div>
                        </div>
                    </template>
                    <template #content>
                        <div class="p-4">
                            <div class="mb-4">
                                <h3 class="text-sm font-semibold text-gray-500 mb-1">Username</h3>
                                <p class="text-lg break-words">{{ playerInfo.username || "Guest User" }}</p>
                            </div>
                            <div class="mb-4">
                                <h3 class="text-sm font-semibold text-gray-500 mb-1">Display Name</h3>
                                <p class="text-lg break-words">{{ playerInfo.displayName || "Not Set" }}</p>
                            </div>
                            <div class="mb-4">
                                <h3 class="text-sm font-semibold text-gray-500 mb-1">Account Type</h3>
                                <p class="text-lg">{{ playerInfo.guest ? "Guest" : "Registered" }}</p>
                            </div>

                            <div v-if="playerInfo.guest" class="mt-4 md:mt-6 p-3 md:p-4 bg-amber-50 dark:bg-gray-700 border-l-4 border-amber-400 dark:border-amber-600 rounded">
                                <div class="flex">
                                    <i class="pi pi-info-circle text-amber-500 mr-2 text-lg"></i>
                                    <div>
                                        <p class="text-sm font-medium">Guest accounts have limited features</p>
                                        <p class="text-xs mt-1">Create a registered account to access all features including profile customization.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- Update Profile Form -->
                <Card class="col-span-1 md:col-span-2 shadow-lg" v-if="!playerInfo.guest">
                    <template #header>
                        <div class="bg-gradient-to-r from-green-600 to-teal-700 p-3 md:p-4 rounded-t-lg">
                            <h2 class="text-lg md:text-xl font-bold text-white">Update Profile</h2>
                            <p class="text-green-100 text-xs md:text-sm">Change your display name or password</p>
                        </div>
                    </template>
                    <template #content>
                        <div class="p-3 md:p-4">
                            <form @submit.prevent="submitProfileUpdate">
                                <div class="mb-5">
                                    <h3 class="text-base md:text-lg font-semibold mb-2 md:mb-3">Display Name</h3>
                                    <InputGroup>
                                        <InputGroupAddon>
                                            <i class="pi pi-user"></i>
                                        </InputGroupAddon>
                                        <InputText
                                            v-model="updateForm.displayName"
                                            placeholder="Enter new display name"
                                            class="w-full"
                                            :class="{ 'p-invalid': displayNameError }"
                                            @blur="validateDisplayName"
                                        />
                                    </InputGroup>
                                    <small v-if="displayNameError" class="p-error block mt-1">{{ displayNameError }}</small>
                                    <small class="text-gray-500 block mt-1 text-xs md:text-sm" v-else>This name will be visible to other players during gameplay</small>
                                </div>

                                <Divider align="center" class="my-4">
                                    <Badge value="Optional" severity="secondary"></Badge>
                                </Divider>

                                <div class="mb-5">
                                    <h3 class="text-base md:text-lg font-semibold mb-2 md:mb-3">Change Password</h3>
                                    <div class="mb-4">
                                        <InputGroup>
                                            <InputGroupAddon>
                                                <i class="pi pi-lock"></i>
                                            </InputGroupAddon>
                                            <Password
                                                v-model="updateForm.password"
                                                placeholder="Enter new password"
                                                class="w-full"
                                                :feedback="true"
                                                :toggleMask="true"
                                                @blur="validatePassword"
                                                :inputStyle="{ width: '100%' }"
                                            />
                                        </InputGroup>
                                        <small v-if="passwordError" class="p-error block mt-1">{{ passwordError }}</small>
                                        <small class="text-gray-500 block mt-1 text-xs md:text-sm" v-else>Leave blank to keep your current password</small>
                                    </div>

                                    <div class="mb-4">
                                        <InputGroup>
                                            <InputGroupAddon>
                                                <i class="pi pi-lock-open"></i>
                                            </InputGroupAddon>
                                            <Password
                                                v-model="updateForm.confirmPassword"
                                                placeholder="Confirm new password"
                                                class="w-full"
                                                :toggleMask="true"
                                                :feedback="false"
                                                @blur="validateConfirmPassword"
                                                :class="{ 'p-invalid': confirmPasswordError }"
                                                :inputStyle="{ width: '100%' }"
                                            />
                                        </InputGroup>
                                        <small v-if="confirmPasswordError" class="p-error block mt-1">{{ confirmPasswordError }}</small>
                                    </div>
                                </div>

                                <div class="flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-3 mt-6">
                                    <Button type="button" label="Cancel" class="p-button-outlined p-button-secondary w-full sm:w-auto" @click="resetForm" />
                                    <Button
                                        type="submit"
                                        label="Update Profile"
                                        icon="pi pi-check"
                                        :loading="isLoading"
                                        :disabled="!isFormValid || isLoading"
                                        class="w-full sm:w-auto"
                                    />
                                </div>
                            </form>
                        </div>
                    </template>
                </Card>

                <!-- Placeholder for Guest Users -->
                <Card class="col-span-1 md:col-span-2 shadow-lg" v-else>
                    <template #header>
                        <div class="bg-gradient-to-r from-gray-600 to-gray-700 p-3 md:p-4 rounded-t-lg">
                            <h2 class="text-lg md:text-xl font-bold text-white">Create an Account</h2>
                        </div>
                    </template>
                    <template #content>
                        <div class="p-4 md:p-6 flex flex-col items-center justify-center">
                            <i class="pi pi-lock text-5xl md:text-6xl text-gray-400 mb-4"></i>
                            <h3 class="text-lg md:text-xl font-semibold mb-2">Profile Customization Locked</h3>
                            <p class="text-gray-500 text-center text-sm md:text-base mb-5 md:mb-6">
                                Create a registered account to customize your profile and access all GeoBattles features.
                            </p>

                            <Button label="Create Account" icon="pi pi-user-plus" class="p-button-primary w-full sm:w-auto" @click="navigateToSignup" />
                        </div>
                    </template>
                </Card>
            </div>
        </div>

        <!-- Success Dialog -->
        <Dialog
            v-model:visible="showSuccessDialog"
            :modal="true"
            :closable="false"
            :showHeader="false"
            :pt="{
                root: { class: 'border-0 rounded-xl shadow-lg' },
            }"
            class="max-w-[90vw] sm:max-w-md"
            :style="{ width: 'auto' }"
        >
            <div class="flex flex-col items-center p-5 md:p-6">
                <div class="w-16 h-16 md:w-20 md:h-20 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mb-4 animate-pulse">
                    <i class="pi pi-check-circle text-green-600 dark:text-green-200 text-4xl md:text-5xl"></i>
                </div>
                <div class="text-center">
                    <h2 class="text-xl md:text-2xl font-bold mb-2">Profile Updated!</h2>
                    <p class="text-gray-600 dark:text-gray-300 text-sm md:text-base mb-5">Your changes have been saved successfully.</p>
                </div>
                <Button label="Continue" icon="pi pi-arrow-right" @click="showSuccessDialog = false" class="w-full" autofocus />
            </div>
        </Dialog>

        <Toast position="bottom-center" />
    </div>
</template>

<script setup lang="ts">
const router = useRouter();
const playerInfo = usePlayerInfo();
const authStore = useAuthStore();
const toast = useToast();
const isLoading = ref(false);
const showSuccessDialog = ref(false);

// Form data
const updateForm = reactive({
    displayName: "",
    password: "",
    confirmPassword: "",
});

// Form validation errors
const displayNameError = ref<string | null>(null);
const passwordError = ref<string | null>(null);
const confirmPasswordError = ref<string | null>(null);

/**
 * Computed property to check if form is valid for submission
 */
const isFormValid = computed(() => {
    // First check if there's any change to submit
    const hasDisplayNameChange = updateForm.displayName !== playerInfo.value.displayName;
    const hasPasswordChange = !!updateForm.password;

    // If nothing has changed, form is not valid
    if (!hasDisplayNameChange && !hasPasswordChange) {
        return false;
    }

    // Check for display name validation
    if (displayNameError.value) {
        return false;
    }

    // For password changes, ensure both validation checks pass and confirmation is entered
    if (hasPasswordChange) {
        // If password is provided:
        // 1. Password validation must pass (no errors)
        // 2. Confirm password must be entered
        // 3. Confirm password validation must pass
        if (passwordError.value || !updateForm.confirmPassword || confirmPasswordError.value) {
            return false;
        }
    }

    // If we get here, the form is valid
    return true;
});

/**
 * Validates the display name field
 */
function validateDisplayName() {
    displayNameError.value = null;

    if (!updateForm.displayName) {
        displayNameError.value = "Display name is required";
        return;
    }

    if (updateForm.displayName.length < 3) {
        displayNameError.value = "Display name must be at least 3 characters";
        return;
    }

    if (updateForm.displayName.length > 15) {
        displayNameError.value = "Display name must be less than 15 characters";
    }
}

/**
 * Validates the password field
 */
function validatePassword() {
    passwordError.value = null;

    // Only validate if password is provided (it's optional)
    if (updateForm.password) {
        // Minimal validation - just check if password exists
        if (updateForm.password.length < 1) {
            passwordError.value = "Password cannot be empty";
        }
    }

    // Re-validate confirm password if it exists
    if (updateForm.confirmPassword) {
        validateConfirmPassword();
    }
}

/**
 * Validates the confirm password field
 */
function validateConfirmPassword() {
    confirmPasswordError.value = null;

    if (updateForm.password && !updateForm.confirmPassword) {
        confirmPasswordError.value = "Please confirm your password";
        return;
    }

    if (updateForm.password && updateForm.confirmPassword !== updateForm.password) {
        confirmPasswordError.value = "Passwords do not match";
    }
}

/**
 * Resets the form to initial values
 */
function resetForm() {
    // Reset form to current values
    updateForm.displayName = playerInfo.value?.displayName || "";
    updateForm.password = "";
    updateForm.confirmPassword = "";

    // Clear any validation errors
    displayNameError.value = null;
    passwordError.value = null;
    confirmPasswordError.value = null;
}

/**
 * Navigates to the signup page
 */
function navigateToSignup() {
    router.push("/signup");
}

/**
 * Submits the profile update form
 */
async function submitProfileUpdate() {
    // Run all validations one more time
    validateDisplayName();
    validatePassword();
    validateConfirmPassword();

    if (!isFormValid.value) {
        return;
    }

    try {
        isLoading.value = true;

        // Determine what to update
        const displayName = updateForm.displayName !== playerInfo.value.displayName ? updateForm.displayName : null;
        const password = updateForm.password ? updateForm.password : null;

        // Submit update to the backend
        await authStore.updateUser(displayName, password);

        // Reset password fields
        updateForm.password = "";
        updateForm.confirmPassword = "";

        // Show success message
        showSuccessDialog.value = true;
    } catch (error: any) {
        console.error("Error updating profile:", error);
        toast.add({
            severity: "error",
            summary: "Update Failed",
            detail: error.message || "Failed to update profile. Please try again.",
            life: 5000,
        });
    } finally {
        isLoading.value = false;
    }
}

// Initialize form with current display name when component is mounted
onMounted(() => {
    resetForm();
});
</script>

<style scoped>
/* Custom styles for profile page */
:deep(.p-card-header) {
    padding: 0;
}

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
