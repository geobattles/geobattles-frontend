import { ref, computed } from 'vue'

const isConnected = ref(true)
const isReconnecting = ref(false)

export const useConnectionStatus = () => {
  const setConnected = (status: boolean) => {
    isConnected.value = status
    isReconnecting.value = false
    }

    const setReconnecting = (status: boolean) => {
        isReconnecting.value = status;
  }

  const connectionStatus = computed(() => {
    if (isConnected.value) return 'connected'
    if (isReconnecting.value) return 'reconnecting'
    return 'disconnected'
  })

    return {
        isConnected,
        isReconnecting,
        connectionStatus,
        setConnected,
        setReconnecting,
  }
}