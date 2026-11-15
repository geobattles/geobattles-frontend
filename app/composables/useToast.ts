export type ToastSeverity = "success" | "info" | "warn" | "error" | "secondary" | "contrast";
export interface ToastOptions {
    severity?: ToastSeverity;
    summary?: string;
    detail?: string;
    life?: number;
}
export interface ToastMessage extends ToastOptions {
    id: number;
}

/** Data is request scoped. Only the mounted viewport owns dismissal timers. */
export const useToast = () => {
    const messages = useState<ToastMessage[]>("ui:toasts", () => []);
    const nextId = useState("ui:toastId", () => 0);
    const remove = (id: number) => {
        messages.value = messages.value.filter((message) => message.id !== id);
    };
    return {
        messages: readonly(messages),
        add: (options: ToastOptions) => {
            const id = ++nextId.value;
            messages.value = [...messages.value.slice(-3), { ...options, severity: options.severity ?? "info", life: options.life ?? 6000, id }];
            return id;
        },
        remove,
        removeAll: () => {
            messages.value = [];
        },
    };
};
