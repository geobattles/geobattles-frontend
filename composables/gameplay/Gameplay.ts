export class Gameplay {
    // Send signal to backend to start new round
    static nextRound = () => {
        const game = {
            command: "start",
        };
        useSocketConnection().value.send(JSON.stringify(game));
    };

    // Send current pin location to server
    static submitGuess = () => {
        const socket_message = {
            command: "submit_location",
            location: useCurrentPin().value,
        };

        useSocketConnection().value.send(JSON.stringify(socket_message));
    };
}
