import { ResultInfo } from "~/types";

export const processNewResult = (user: string, player_result: ResultInfo) => {
    // Apply result to player only if it is higher than the previous result
    if (useResults().value[user]?.baseScr > player_result.baseScr) return;
    useResults().value[user] = player_result;

    const results = useResults().value; // Get results from state

    // Sort results by score
    useResults().value = Object.fromEntries(Object.entries(results).sort(([, a], [, b]) => b.baseScr - a.baseScr));
};
