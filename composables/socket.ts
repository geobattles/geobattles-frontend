export const initializeSocketConnection = (lobby_id: string): void => {
    const socket = new WebSocket("http://localhost:8080".replace(/(http)(s)?\:\/\//, "ws$2://") + `/lobbySocket?id=${lobby_id}&name=${usePlayerInfo().value.name}`);

    // Save socket connection to state
    useSocketConnection().value = socket;

    socket.onopen = () => {
        console.log("Socket connection established");
    };
    socket.onerror = (error) => {
        console.log(`WebSocket error: ${error}`);
    };
    socket.onclose = () => {
        console.log("Socket connection closed");
    };
    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log(`Socket message received: ${data}`);
    };
};
