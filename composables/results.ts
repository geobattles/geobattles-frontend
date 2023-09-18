import { ResultsInfo } from "~/types";

export const processNewResult = (user: string, player_result: ResultsInfo) => {
    const results = useResults().value; // Get results from state

    if (results[user]?.baseScr > player_result.baseScr) {
        // Update attempts and lives, not the score
        results[user].lives = player_result.lives;
        results[user].attempt = player_result.attempt;
    } else {
        results[user] = player_result; // Update everything
        // Sort results by score
        useResults().value = Object.fromEntries(Object.entries(results).sort(([, a], [, b]) => b.baseScr - a.baseScr));
    }
    useIsSubmitDisabled().value = false; // Enable submit button
};
