import { ResultInfo } from "~/types";

export const processNewResult = (user: string, player_result: ResultInfo) => {
    // Append new result. // TODO: Only if it is higher than the previous result
    useResults().value[user] = player_result;

    const results = useResults().value; // Get results from state

    // Sort results by score
    useResults().value = Object.fromEntries(Object.entries(results).sort(([, a], [, b]) => b.baseScr - a.baseScr));
};
