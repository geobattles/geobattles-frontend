<template>
    <div>
        <Tag
            :class="['cursor-pointer transition-all duration-300', isCopied ? 'animate-pulse scale-105 shadow-md' : '']"
            :icon="inviteLinkTagSettings.icon"
            :severity="inviteLinkTagSettings.severity"
            :value="inviteLinkTagSettings.value"
            @click="copyInviteLink()"
        />
    </div>
</template>

<script setup lang="ts">
const lobbyStore = useLobbyStore();
const inviteLinkTagSettings = ref({
    value: "Copy Invite Link",
    severity: "info",
    icon: "pi pi-copy",
});
const isCopied = ref(false);

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
            isCopied.value = true;

            setTimeout(() => {
                inviteLinkTagSettings.value.value = "Copy Invite Link";
                inviteLinkTagSettings.value.severity = "info";
                inviteLinkTagSettings.value.icon = "pi pi-copy";
                isCopied.value = false;
            }, 2000);
        })
        .catch((err) => {
            console.error("Failed to copy invite link:", err);
        });
};
</script>

<style scoped></style>
