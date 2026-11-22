const codeCharacters = "123456789ABCDEFGHJKLMNPRSTUVWXYZ";
const completeCode = new RegExp(`^[${codeCharacters}]{4}$`);
const partialCode = new RegExp(`^[${codeCharacters}]{0,4}$`);
const dashedCode = new RegExp(`^[${codeCharacters}](?:-[${codeCharacters}]){3}$`);

export const normalizeLobbyCode = (value: string) => value.replace(/[a-z]/g, (letter) => letter.toUpperCase());
export const isLobbyCode = (value: string) => value.length === 4 && completeCode.test(value);
export const isPartialLobbyCode = (value: string) => partialCode.test(value);

export function parseLobbyCode(raw: string, origin?: string): { code: string } | { error: string } {
    let value = raw.trim();
    if (/^https?:\/\//i.test(value)) {
        try {
            const url = new URL(value);
            if (url.origin !== origin || url.username || url.password || url.pathname !== "/lobby/join" || url.searchParams.getAll("id").length !== 1)
                throw new Error("Invalid invite");
            value = url.searchParams.get("id") ?? "";
        } catch {
            return { error: "Use an invite link from this GeoBattles site." };
        }
        const code = normalizeLobbyCode(value);
        return isLobbyCode(code) ? { code } : { error: "This invite doesn’t contain a valid game code." };
    }
    value = normalizeLobbyCode(value);
    if (dashedCode.test(value)) value = value.replaceAll("-", "");
    return isLobbyCode(value) ? { code: value } : { error: "Enter the four-character code from your host." };
}
