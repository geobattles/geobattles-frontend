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

    /**
     * Will apply guess styles to a player who guessed.
     *
     * @param player_id Player that made a guess
     * @param previous_leader Previous leader
     * @param new_leader New leader
     */
    static applyGuessStyles = (player_id: string, previous_leader: string, new_leader: string) => {
        const player_dom: HTMLElement | null = document.getElementById(player_id);
        if (new_leader === player_id) setTimeout(() => (new_leader === previous_leader ? player_dom?.classList.add("applied-guess") : player_dom?.classList.add("applied-guess-lead")), 100); // Apply winning styles for new leader
        else setTimeout(() => player_dom?.classList.add("applied-guess"), 100); // Apply gray styles for guess
        setTimeout(() => player_dom?.classList.remove("applied-guess-lead", "applied-guess"), new_leader === player_id ? 1400 : 1200); // Remove guess styles
    };
}
