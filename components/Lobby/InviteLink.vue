<template>
    <div>
        <Tag class="cursor-pointer" :icon="inviteLinkTagSettings.icon" :severity="inviteLinkTagSettings.severity" :value="inviteLinkTagSettings.value" @click="copyInviteLink()" />
    </div>
</template>

<script setup lang="ts">
const lobbyStore = useLobbyStore();
const inviteLinkTagSettings = ref({
    value: "Copy Invite Link",
    severity: "info",
    icon: "pi pi-copy",
});

const inviteLink = computed(() => {
    return `${window.location.origin}/lobby/join?id=${lobbyStore.lobbySettings?.ID}`;
});

const copyInviteLink = () => {
    navigator.clipboard
        .writeText(inviteLink.value)
        .then(() => {
            inviteLinkTagSettings.value.value = "Copied";
            inviteLinkTagSettings.value.severity = "success";
            inviteLinkTagSettings.value.icon = "pi pi-check";

            setTimeout(() => {
                inviteLinkTagSettings.value.value = "Copy Invite Link";
                inviteLinkTagSettings.value.severity = "info";
                inviteLinkTagSettings.value.icon = "pi pi-copy";
            }, 2000);
        })
        .catch((err) => {
            console.error("Failed to copy invite link:", err);
        });
};
</script>

<style scoped></style>
