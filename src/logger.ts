import { IS_PROD } from "./environment";

export const logger = {
    logDebug(...args) {
        if (!IS_PROD) {
            console.log(...args);
        }
    },

    log(...args) {
        console.log(...args);
    }
}