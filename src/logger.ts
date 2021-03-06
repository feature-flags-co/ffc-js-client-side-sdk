import { debugModeQueryStr } from "./constants";

// get debug mode from query string
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const debugModeParam = urlParams.get(debugModeQueryStr);

export const logger = {
    logDebug(...args) {
        if (debugModeParam === 'true') {
            console.log(...args);
        }
    },

    log(...args) {
        console.log(...args);
    }
}